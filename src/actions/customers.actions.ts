"use server";

import { Customer } from "@prisma/client";
import { db as prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// --- Helper Types ---
interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string>;
}

// Authorization helper
async function checkUserAuthorization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  // Check if user is a member of the organization
  const member = await prisma.member.findUnique({
    where: {
      userId_organizationId: {
        userId: userId,
        organizationId: organizationId,
      },
    },
  });
  return !!member;
}

// Get server session helper
async function getServerSession() {
  return await auth.api.getSession({ headers: await headers() });
}

/**
 * Fetch customers for an organization
 */
export async function getCustomers(page = 1, pageSize = 10): Promise<ActionResponse<{ customers: Customer[]; totalCount: number }>> {
  try {
    // Get current user session
    const session = await getServerSession();
    if (!session?.user?.id || !session.session?.activeOrganizationId) {
      return { 
        success: false, 
        error: "Unauthorized or no active organization" 
      };
    }

    const organizationId = session.session?.activeOrganizationId;
    const userId = session.user.id;

    // Verify user is authorized for this organization
    if (!(await checkUserAuthorization(userId, organizationId))) {
      return { 
        success: false, 
        error: "User not authorized for this organization" 
      };
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;

    // Fetch customers
    const [customers, totalCount] = await Promise.all([
      prisma.customer.findMany({
        where: { 
          organizationId,
        },
        orderBy: { 
          createdAt: 'desc' 
        },
        skip,
        take: pageSize,
      }),
      prisma.customer.count({
        where: { 
          organizationId,
        },
      })
    ]);

    return {
      success: true,
      data: { customers, totalCount }
    };
  } catch (error) {
    console.error("Error fetching customers:", error);
    return {
      success: false,
      error: "Failed to fetch customers"
    };
  }
}

/**
 * Add a new customer
 */
export async function addCustomer(
  data: {
    name: string;
    email: string;
    company?: string;
    status: "active" | "inactive" | "pending";
  }
): Promise<ActionResponse<Customer>> {
  try {
    // Get current user session
    const session = await getServerSession();
    if (!session?.user?.id || !session.session?.activeOrganizationId) {
      return { 
        success: false, 
        error: "Unauthorized or no active organization" 
      };
    }

    const organizationId = session.session?.activeOrganizationId;
    const userId = session.user.id;

    // Verify user is authorized for this organization
    if (!(await checkUserAuthorization(userId, organizationId))) {
      return { 
        success: false, 
        error: "User not authorized for this organization" 
      };
    }

    // Check if customer with this email already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        email: data.email,
      }
    });

    if (existingCustomer) {
      return {
        success: false,
        error: "A customer with this email already exists",
        validationErrors: {
          email: "A customer with this email already exists"
        }
      };
    }

    // Create the customer
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email,
        loyaltyPoints: 0,
        createdBy: {
          connect: { id: userId }
        },
        customerId:`CUST_${Math.random().toString(36).substring(2)}`,
        organization: {
          connect: { id: organizationId }
        },
        updatedBy: {
          connect: { id: userId }
        },
        orders: {
          create: []
        },
      }
    });

    // Revalidate customers path to update UI
    revalidatePath('/customers');
    
    return {
      success: true,
      data: customer
    };
  } catch (error) {
    console.error("Error adding customer:", error);
    return {
      success: false,
      error: "Failed to add customer"
    };
  }
}

/**
 * Delete a customer (soft delete)
 */
export async function deleteCustomer(
  customerId: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Get current user session
    const session = await getServerSession();
    if (!session?.user?.id || !session.session?.activeOrganizationId) {
      return { 
        success: false, 
        error: "Unauthorized or no active organization" 
      };
    }

    const organizationId = session.session?.activeOrganizationId;
    const userId = session.user.id;

    // Verify user is authorized for this organization
    if (!(await checkUserAuthorization(userId, organizationId))) {
      return { 
        success: false, 
        error: "User not authorized for this organization" 
      };
    }

    // Check if customer exists and belongs to this organization
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
      }
    });

    if (!customer) {
      return {
        success: false,
        error: "Customer not found"
      };
    }

    // Soft delete the customer (mark as inactive)
    await prisma.customer.update({
      where: { id: customerId },
      data: { 
        updatedAt: new Date(),
      }
    });

    // Revalidate customers path to update UI
    revalidatePath('/customers');
    
    return {
      success: true,
      data: { id: customerId }
    };
  } catch (error) {
    console.error("Error deleting customer:", error);
    return {
      success: false,
      error: "Failed to delete customer"
    };
  }
}

/**
 * Get a single customer by ID
 */
export async function getCustomer(
  customerId: string
): Promise<ActionResponse<Customer>> {
  try {
    // Get current user session
    const session = await getServerSession();
    if (!session?.user?.id || !session.session?.activeOrganizationId) {
      return { 
        success: false, 
        error: "Unauthorized or no active organization" 
      };
    }

    const organizationId = session.session?.activeOrganizationId;
    const userId = session.user.id;

    // Verify user is authorized for this organization
    if (!(await checkUserAuthorization(userId, organizationId))) {
      return { 
        success: false, 
        error: "User not authorized for this organization" 
      };
    }

    // Fetch customer with orders
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
      },
      include: {
        sales:true
      }
    });

    if (!customer) {
      return {
        success: false,
        error: "Customer not found"
      };
    }

    return {
      success: true,
      data: customer
    };
  } catch (error) {
    console.error("Error fetching customer:", error);
    return {
      success: false,
      error: "Failed to fetch customer"
    };
  }
}

/**
 * Get user and organization info for the page
 */
export async function getAuthInfo(): Promise<ActionResponse<{ userId: string; organizationId: string }>> {
  try {
    const session = await getServerSession();
    if (!session?.user?.id || !session.session?.activeOrganizationId) {
      return { 
        success: false, 
        error: "Unauthorized or no active organization" 
      };
    }

    return {
      success: true,
      data: {
        userId: session.user.id,
        organizationId: session.session?.activeOrganizationId
      }
    };
  } catch (error) {
    console.error("Error getting auth info:", error);
    return {
      success: false,
      error: "Failed to get authentication information"
    };
  }
} 