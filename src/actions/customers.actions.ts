"use server";

import { Customer, Prisma } from "@/prisma/client";
import { db, db as prisma } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { getServerAuthContext } from "./auth";
import { CustomerFormSchema, CustomerIdSchema, CustomerWithDetails, LoyaltyAdjustmentSchema } from "@/lib/validations/customers";

// --- Helper Types ---

// Standardized response structure for actions
interface ActionResponse<TData = null> {
  success: boolean;
  message?: string; // User-friendly message for UI feedback
  data?: TData;
  errors?: Record<string, string[]> | null; // Field-specific validation errors
}


// --- Customer Server Actions ---

/**
 * Fetch a paginated, searchable, and sortable list of customers
 * for the current user's active organization.
 */
export async function getCustomers(searchParams?: {
  query?: string;
  status?: "active" | "inactive" | "all";
  sortBy?: keyof Pick<
    Customer,
    "name" | "email" | "createdAt" | "loyaltyPoints"
  >; // Allow sorting by these fields
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}): Promise<
  ActionResponse<{
    customers: Customer[];
    totalCount: number;
    totalPages: number;
  }>
> {
  const { organizationId } = await getServerAuthContext();

  // Authorization check (optional, if base membership isn't enough)
  // if (!(await checkUserAuthorization(userId, organizationId))) {
  //   return { success: false, message: "You are not authorized to view customers for this organization." };
  // }

  try {
    const {
      query = "",
      status = "all",
      sortBy = "name",
      sortOrder = "asc",
      page = 1,
      pageSize = 15, // Default page size
    } = searchParams || {};

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: Prisma.CustomerWhereInput = {
      organizationId: organizationId, // ** Crucial: Filter by organization **
      AND: [
        // Search Query
        query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { phone: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
        // Status Filter
        status !== "all" ? { isActive: status === "active" } : {},
      ],
    };

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [customers, totalCount] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      success: true,
      data: {
        customers,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  } catch (error) {
    console.error("Error fetching customers:", error);
    return {
      success: false,
      message: "Failed to fetch customers. Please try again later.",
    };
  }
}

/**
 * Fetch detailed information for a single customer by ID,
 * ensuring they belong to the user's organization.
 */
export async function getCustomerById(
  customerId: string,
): Promise<ActionResponse<CustomerWithDetails>> {
  const validatedId = CustomerIdSchema.safeParse({ id: customerId });
  if (!validatedId.success) {
    return {
      success: false,
      message: "Invalid Customer ID provided.",
      errors: validatedId.error.flatten().fieldErrors,
    };
  }

  const authContext = await getServerAuthContext();
  if (!authContext) {
    return { success: false, message: "Authentication required." };
  }
  const {  organizationId } = authContext;

  // Authorization check (optional, if base membership isn't enough)
  // if (!(await checkUserAuthorization(userId, organizationId))) {
  //   return { success: false, message: "You are not authorized to view customers for this organization." };
  // }

  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id: validatedId.data.id,
        organizationId: organizationId, // ** Crucial: Ensure customer belongs to the org **
      },
      include: {
        sales: {
          select: {
            id: true,
            saleNumber: true,
            saleDate: true,
            finalAmount: true,
            paymentStatus: true,
          },
          orderBy: { saleDate: "desc" },
          take: 50,
        },
        loyaltyTransactions: {
          include: {
            member: { select: { user: { select: { name: true, email: true } } } },
          },
          orderBy: { transactionDate: "desc" },
          take: 50,
        },
        createdBy: {
          select: { user: { select: { name: true, email: true } } },
        },
        updatedBy: {
          select: { user: { select: { name: true, email: true } } },
        },
      },
    });

    if (!customer) {
      return {
        success: false,
        message: "Customer not found or access denied.",
      };
    }

    return { success: true, data: customer };
  } catch (error) {
    console.error(`Error fetching customer ${customerId}:`, error);
    return {
      success: false,
      message: "Failed to fetch customer details. Please try again.",
    };
  }
}

/**
 * Creates or updates a customer based on FormData.
 * Handles validation and ensures uniqueness constraints.
 */
export async function saveCustomer(
  formData: unknown
): Promise<ActionResponse<{ customer: Customer }>> {
  const authContext = await getServerAuthContext();
  if (!authContext) {
    return { success: false, message: "Authentication required." };
  }
  const { memberId, organizationId } = authContext;

  const validatedFields = CustomerFormSchema.safeParse(formData);

  if (!validatedFields.success) {
    console.error("Validation Error:", validatedFields.error.flatten());
    return {
      success: false,
      message: "Validation failed. Please check the form.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id, ...customerData } = validatedFields.data;
  const dataToSave = {
    ...customerData,
    email: customerData.email || null, // Store null if email is empty string
    organizationId: organizationId, // Always set organization context
    updatedById: memberId, // Set who last updated
  };

  try {
    let savedCustomer: Customer;
    let successMessage: string;

    // Check for existing email ONLY if email is provided and is different from the current customer's email (on update)
    if (dataToSave.email) {
      const existingEmailCondition: Prisma.CustomerWhereInput = {
        email: dataToSave.email,
        organizationId: organizationId, // Check within the same org
        id: id ? { not: id } : undefined, // Exclude self if updating
      };
      const existingCustomerByEmail = await prisma.customer.findFirst({
        where: existingEmailCondition,
        select: { id: true },
      });

      if (existingCustomerByEmail) {
        return {
          success: false,
          message: `A customer with the email "${dataToSave.email}" already exists in this organization.`,
          errors: { email: [`Email "${dataToSave.email}" is already in use.`] },
        };
      }
    }

    if (id) {
      // --- Update Existing Customer ---
      savedCustomer = await prisma.customer.update({
        where: {
          id: id,
          organizationId: organizationId,
        },
        data: dataToSave,
      });
      successMessage = "Customer updated successfully.";
      revalidateTag(`customer_${id}`); // Revalidate specific customer detail cache
    } else {
      // --- Create New Customer ---
      
      savedCustomer = await prisma.customer.create({
        data: {
          ...dataToSave,
          createdById: memberId,
          id: `CUST_${crypto.randomUUID().slice(0,6)}`,
        },
      });
      successMessage = "Customer created successfully.";
    }

    revalidatePath("/customers"); 

    return {
      success: true,
      message: successMessage,
      data: { customer: savedCustomer },
    };
  } catch (error) {
    console.error("Database Error saving customer:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation (likely email, if schema enforces it)
      if (error.code === "P2002") {
        // The specific field causing the error is in error.meta.target
        const targetField =
          (error.meta?.target as string[])?.join(", ") || "field";
        if (targetField.includes("email")) {
          return {
            success: false,
            message: `Error: A customer with this email already exists.`,
            errors: { email: ["This email address is already registered."] },
          };
        }
        return {
          success: false,
          message: `Error: A unique value constraint failed (${targetField}). Please check your input.`,
        };
      }
      // Record to update not found (possible race condition or invalid ID)
      if (error.code === "P2025") {
        return {
          success: false,
          message: "Error: Could not find the customer record to update.",
        };
      }
    }
    // General error
    return {
      success: false,
      message: id
        ? "Database Error: Failed to update customer."
        : "Database Error: Failed to create customer.",
    };
  }
}

/**
 * Soft deletes a customer by setting isActive = false.
 * Ensures the customer belongs to the user's organization.
 */
export async function deleteCustomer(
  customerId: string
): Promise<ActionResponse<{ id: string }>> {
  const validatedId = CustomerIdSchema.safeParse({ id: customerId });
  if (!validatedId.success) {
    return {
      success: false,
      message: "Invalid Customer ID provided.",
      errors: validatedId.error.flatten().fieldErrors,
    };
  }

  const authContext = await getServerAuthContext();
  if (!authContext) {
    return { success: false, message: "Authentication required." };
  }
  const { userId, organizationId } = authContext;

  try {
    // Check if customer exists and belongs to the organization before attempting update
    const customer = await prisma.customer.findFirst({
      where: {
        id: validatedId.data.id,
        organizationId: organizationId,
      },
      select: { id: true, isActive: true }, // Select only needed fields
    });

    if (!customer) {
      return {
        success: false,
        message: "Customer not found or access denied.",
      };
    }

    if (!customer.isActive) {
      return {
        success: true,
        message: "Customer is already inactive.",
        data: { id: validatedId.data.id },
      };
    }

    // Perform soft delete
    await prisma.customer.update({
      where: {
        id: validatedId.data.id,
        // No need for organizationId here again as we've already verified ownership
      },
      data: {
        isActive: false,
        updatedById: userId, // Track who deactivated
      },
    });

    revalidatePath("/dashboard/customers"); // Update list view
    revalidateTag(`customer_${validatedId.data.id}`); 

    return {
      success: true,
      message: "Customer deactivated successfully.",
      data: { id: validatedId.data.id },
    };
  } catch (error) {
    console.error(`Error deactivating customer ${customerId}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      // Should not happen due to the check above, but handle defensively
      return {
        success: false,
        message: "Error: Customer not found during update.",
      };
    }
    return {
      success: false,
      message: "Database Error: Failed to deactivate customer.",
    };
  }
}

/**
 * Adds a manual loyalty point transaction and updates the customer's balance.
 * Performs checks and uses a database transaction for atomicity.
 */
export async function addManualLoyaltyTransaction(
  formData: FormData
): Promise<ActionResponse<{ newPoints: number }>> {
  const authContext = await getServerAuthContext();
  if (!authContext) {
    return { success: false, message: "Authentication required." };
  }
  const { userId, organizationId } = authContext;

  const validatedFields = LoyaltyAdjustmentSchema.safeParse({
    customerId: formData.get("customerId"),
    pointsChange: formData.get("pointsChange"),
    reason: formData.get("reason"),
    notes: formData.get("notes") || undefined,
  });

  if (!validatedFields.success) {
    console.error("Loyalty Validation Error:", validatedFields.error.flatten());
    return {
      success: false,
      message: "Invalid loyalty adjustment data.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { customerId, pointsChange, reason, notes } = validatedFields.data;

  try {
    // Use a transaction to ensure updating points and adding log happens atomically
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get current customer points and verify ownership (lock row implicitly within transaction)
      const customer = await tx.customer.findUnique({
        where: {
          id: customerId,
          organizationId: organizationId, // ** Ensure customer belongs to org **
        },
        select: { loyaltyPoints: true, isActive: true },
      });

      if (!customer) {
        throw new Error(`Customer not found or access denied.`);
      }
      if (!customer.isActive) {
        throw new Error(`Cannot adjust points for an inactive customer.`);
      }

      const newLoyaltyPoints = customer.loyaltyPoints + pointsChange;
      if (newLoyaltyPoints < 0) {
        throw new Error(
          `Adjustment results in negative points (${newLoyaltyPoints}). Current balance: ${customer.loyaltyPoints}.`
        );
      }

      // 2. Create the loyalty transaction record
      const loyaltyTx = await tx.loyaltyTransaction.create({
        data: {
          customerId: customerId,
          organizationId,
          memberId: userId,
          pointsChange: pointsChange,
          reason: reason,
          notes: notes,
          transactionDate: new Date(), // Server time
        },
      });
      console.log("Loyalty transaction created:", loyaltyTx);

      // 3. Update the customer's loyalty points
      const updatedCustomer = await tx.customer.update({
        where: {
          id: customerId,
          // No need for organizationId again inside transaction on the same record
        },
        data: {
          loyaltyPoints: newLoyaltyPoints,
          updatedById: userId, // Track who triggered the update
        },
      });

      return { updatedCustomer }; // Return necessary data
    });

    // Revalidate caches
    revalidateTag(`customer_${customerId}`); // Detail page (shows points and history)
    revalidatePath("/dashboard/customers");

    return {
      success: true,
      message: `Successfully adjusted points. New balance: ${result.updatedCustomer.loyaltyPoints}`,
      data: { newPoints: result.updatedCustomer.loyaltyPoints },
    };
  } catch (error: unknown) {
    console.error("Loyalty Adjustment Database Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Database error occurred.";
    return {
      success: false,
      message: `Error adjusting loyalty points: ${errorMessage}`,
      // Optionally return specific field errors if applicable
      // errors: { pointsChange: [errorMessage] }
    };
  }
}


/**
 * Fetches detailed information for a single customer.
 */
export async function getCustomerDetails(
  id: string
): Promise<CustomerWithDetails | null> {
  if (!id) return null;
  try {
  const {organizationId} = await getServerAuthContext();
    const customer = await db.customer.findUnique({
      where: { id, organizationId },
      include: {
        sales: {
          select: {
            id: true,
            saleNumber: true,
            saleDate: true,
            finalAmount: true,
            paymentStatus: true, 
          },
          orderBy: { saleDate: "desc" },
          take: 50, // Limit number of sales shown initially
        },
        loyaltyTransactions: {
          include: {
            member: { select: { user: { select: { name: true, email: true } } } }, // Get user's name/email
          },
          orderBy: { transactionDate: "desc" },
          take: 50, // Limit number of loyalty transactions shown
        },
      },
    });
    return customer;
  } catch (error) {
    console.error(`Failed to fetch details for customer ${id}:`, error);
    // Don't throw, return null so the page can handle 'not found'
    return null;
  }
}
