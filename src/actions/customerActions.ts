"use server";

import { LoyaltyReason, Prisma } from "@prisma/client";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import db from "@/lib/db";
import { invalidatePosDataCache } from "@/app/pos/actions";

// --- Type Definitions ---

// Type for detailed customer view
export type CustomerWithDetails = Prisma.CustomerGetPayload<{
  include: {
    sales: {
      // Include sales for history
      select: {
        id: true;
        saleNumber: true;
        saleDate: true;
        finalAmount: true;
        paymentStatus: true; // Show status of the sale payment
      };
      orderBy: {
        saleDate: "desc";
      };
    };
    loyaltyTransactions: {
      // Include loyalty history
      include: {
        user: { select: { name: true; email: true } }; // User who processed it
      };
      orderBy: {
        transactionDate: "desc";
      };
    };
  };
}>;

// --- Validation Schemas ---

const CustomerFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Customer name is required."),
  email: z
    .string()
    .email("Invalid email address.")
    .optional()
    .or(z.literal("")), // Optional but valid email
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

const LoyaltyAdjustmentSchema = z.object({
  customerId: z.string().cuid("Invalid customer ID."),
  pointsChange: z.coerce
    .number()
    .int("Points must be a whole number.")
    .refine((val) => val !== 0, "Points change cannot be zero."), // Must not be zero
  reason: z.nativeEnum(LoyaltyReason).refine(
    (val) =>
      // Allow only manual adjustment reasons
      val === "MANUAL_ADJUSTMENT" ||
      val === "PROMOTION" ||
      val === "SIGN_UP_BONUS" ||
      val === "RETURN_ADJUSTMENT" ||
      val === "OTHER",
    { message: "Invalid reason for manual adjustment." }
  ),
  notes: z.string().optional(),
  // Assuming we get the logged-in user's ID from session/auth context
  // userId: z.string().cuid(),
});


// --- Server Actions ---

/**
 * Fetches a list of customers (add pagination/search later if needed)
 */
export async function getCustomers(searchParams?: {
  query?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}) {
  const {
    query = "",
    status = "all",
    sortBy = "name",
    sortOrder = "asc",
    page = 1,
    pageSize = 10,
  } = searchParams || {};

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // Get current user session
  // const session = await getServerSession();
  // if (!session?.user?.id || !session.session?.activeOrganizationId) {
  //   return {
  //     success: false,
  //     error: "Unauthorized or no active organization",
  //   };
  // }
  const where = {
    AND: [
      {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      status !== "all" ? { isActive: status === "active" } : {},
    ],
  };

  const orderBy = {
    [sortBy]: sortOrder,
  };

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      //@ts-expect-error no error here
      where,
      orderBy,
      skip,
      take,
    }),
    //@ts-expect-error no error here
    db.customer.count({ where }),
  ]);

  return {
    customers,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Fetches detailed information for a single customer.
 */
export async function getCustomerDetails(
  id: string
): Promise<CustomerWithDetails | null> {
  if (!id) return null;
  try {
    // Get current user session
    // const session = await getServerSession();
    // if (!session?.user?.id || !session.session?.activeOrganizationId) {
    //   return {
    //     success: false,
    //     error: "Unauthorized or no active organization",
    //   };
    // }
    const customer = await db.customer.findUnique({
      where: { id },
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
            user: { select: { name: true, email: true } }, // Get user's name/email
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

/**
 * Creates or updates a customer.
 */
export async function saveCustomer(formData: FormData) {
  const validatedFields = CustomerFormSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
    isActive: formData.get("isActive") === "true", // Convert string 'true'/'false'
  });
  

  if (!validatedFields.success) {
    console.error(
      "Validation Error:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid data provided.",
    };
  }

  const { id, ...customerData } = validatedFields.data;

  try {
    let savedCustomer;
    if (id) {
      // Update
      savedCustomer = await db.customer.update({
        where: { id: id },
        data: customerData,
      });
      revalidateTag(`customer_${id}`); // Revalidate specific customer detail page
      revalidatePath("/customers"); // Revalidate list page
      invalidatePosDataCache()
    } else {
      // Create
      // Check for existing email if provided
      if (customerData.email) {
        const existing = await db.customer.findUnique({
          where: { email: customerData.email },
        });
        if (existing) {
          return {
            message: `Error: Customer with email ${customerData.email} already exists.`,
          };
        }
      }
      savedCustomer = await db.customer.create({
        data: {
          ...customerData,
          createdBy: '1',
        },
      });
      revalidatePath("/customer"); // Revalidate list page
      invalidatePosDataCache();
    }

    return {
      message: id
        ? "Customer updated successfully."
        : "Customer created successfully.",
      customer: savedCustomer,
    };
  } catch (error) {
    console.error("Database Error:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Unique constraint (likely email if added later)
      return {
        message: `Error: A customer with this email might already exist.`,
      };
    }
    return { message: "Database Error: Failed to save customer." };
  }
}

/**
 * Deletes a customer. (Consider soft delete by setting isActive=false instead)
 */
export async function deleteCustomer(id: string) {
  if (!id) return { message: "Error: Customer ID is missing." };

  // WARNING: Deleting customers with sales history can cause data integrity issues
  // depending on schema setup (e.g., if Sale.customerId is required).
  // Consider making Sale.customerId optional or implementing soft delete.
  // For now, we'll proceed but add a strong warning.

  // Optional Check: See if customer has sales
  // const salesCount = await db.sale.count({ where: { customerId: id } });
  // if (salesCount > 0) {
  //     return { message: `Error: Cannot delete customer with existing sales (${salesCount}). Consider deactivating instead.` };
  // }

  try {
    await db.customer.delete({
      where: { id: id },
    });
    revalidatePath("/dashboard/customers");
    revalidateTag(`customer_${id}`); // In case someone is viewing the deleted customer
    return {
      message:
        "Customer deleted successfully. (Note: Associated sales might remain)",
    };
  } catch (error) {
    console.error("Database Error:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { message: `Error: Customer with ID ${id} not found.` };
    }
    // Handle potential foreign key constraint errors if Sale.customerId cannot be null
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        message: `Error: Cannot delete customer due to existing related records (e.g., Sales). Consider deactivating.`,
      };
    }
    return { message: "Database Error: Failed to delete customer." };
  }
}

/**
 * Adds a manual loyalty point transaction and updates customer points.
 */
export async function addManualLoyaltyTransaction(
  formData: FormData,
  userId: string | null
) {
  // TODO: Replace this with actual user ID from your auth system
  const HARDCODED_USER_ID = userId ?? "clerk_or_system_user_id"; // Get this from session/auth
  if (!HARDCODED_USER_ID) {
    return { message: "Error: Could not identify logged-in user." };
  }

  const validatedFields = LoyaltyAdjustmentSchema.safeParse({
    customerId: formData.get("customerId"),
    pointsChange: formData.get("pointsChange"),
    reason: formData.get("reason"), // This should be the enum value string
    notes: formData.get("notes") || undefined,
  });

  if (!validatedFields.success) {
    console.error(
      "Loyalty Validation Error:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid loyalty adjustment data.",
    };
  }

  const { customerId, pointsChange, reason, notes } = validatedFields.data;

  try {
    // Use a transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // 1. Get current customer points (and lock the row)
      const customer = await tx.customer.findUnique({
        where: { id: customerId },
        select: { loyaltyPoints: true },
        // Use pessimistic locking if high concurrency is expected, though maybe overkill here
        // For now, just fetch and update. The transaction handles consistency.
      });

      if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found.`);
      }

      const newLoyaltyPoints = customer.loyaltyPoints + pointsChange;
      if (newLoyaltyPoints < 0) {
        throw new Error("Cannot adjust points below zero.");
      }

      // 2. Create the loyalty transaction record
      const loyaltyTx = await tx.loyaltyTransaction.create({
        data: {
          customerId: customerId,
          userId: HARDCODED_USER_ID, // Use actual logged-in user ID
          pointsChange: pointsChange,
          reason: reason,
          notes: notes,
          transactionDate: new Date(), // Use server time
        },
      });

      // 3. Update the customer's loyalty points
      const updatedCustomer = await tx.customer.update({
        where: { id: customerId },
        data: {
          loyaltyPoints: newLoyaltyPoints,
        },
      });

      return { loyaltyTx, updatedCustomer };
    });

    // Revalidate caches
    revalidateTag(`customer_${customerId}`); // Detail page
    revalidatePath("/dashboard/customers"); // List page (loyalty points might be shown there)

    return {
      message: `Successfully adjusted points for customer. New balance: ${result.updatedCustomer.loyaltyPoints}`,
      newPoints: result.updatedCustomer.loyaltyPoints,
    };
  } catch (error) {
    console.error("Loyalty Adjustment Database Error:", error);
    return {
      //@ts-expect-error unknown error type
      message: `Error adjusting points: ${error.message || "Database error"}.`,
    };
  }
}
