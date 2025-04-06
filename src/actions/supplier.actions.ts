"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db"; // Adjust path if needed
import type { Supplier } from "@prisma/client";

// Zod schema for validation (matches Prisma model, adjust as needed)
const supplierSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Supplier name must be at least 2 characters." }),
  contactName: z.string().optional(),
  email: z
    .string()
    .email({ message: "Invalid email address." })
    .optional()
    .or(z.literal("")), // Allow empty string
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  leadTime: z.coerce.number().int().positive().optional().nullable(), // Coerce to number, ensure positive integer
  isActive: z.boolean().default(true),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

// --- Get Suppliers ---
export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const suppliers = await db.supplier.findMany({
      orderBy: { createdAt: "desc" },
    });
    return suppliers;
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    // In a real app, you might want to return a more specific error object
    return [];
  }
}

// --- Get Single Supplier ---
export async function getSupplierById(id: string): Promise<Supplier | null> {
  if (!id) return null;
  try {
    const supplier = await db.supplier.findUnique({
      where: { id },
    });
    return supplier;
  } catch (error) {
    console.error(`Failed to fetch supplier ${id}:`, error);
    return null;
  }
}

// --- Create Supplier ---
export async function createSupplier(data: SupplierFormData) {
  const validationResult = supplierSchema.safeParse(data);

  if (!validationResult.success) {
    // TODO: Improve error reporting to the client
    console.error(
      "Validation failed:",
      validationResult.error.flatten().fieldErrors
    );
    return {
      success: false,
      message: "Validation failed.",
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  try {
    const newSupplier = await db.supplier.create({
      data: validationResult.data,
    });
    revalidatePath("/suppliers"); // Update the cache for the suppliers page
    return {
      success: true,
      message: "Supplier created successfully.",
      supplier: newSupplier,
    };
  } catch (error: any) {
    console.error("Failed to create supplier:", error);
    // Check for unique constraint violation (e.g., name)
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      return {
        success: false,
        message: "A supplier with this name already exists.",
      };
    }
    return {
      success: false,
      message: "Database error: Failed to create supplier.",
    };
  }
}

// --- Update Supplier ---
export async function updateSupplier(id: string, data: SupplierFormData) {
  if (!id) {
    return { success: false, message: "Supplier ID is required." };
  }

  const validationResult = supplierSchema.safeParse(data);

  if (!validationResult.success) {
    console.error(
      "Validation failed:",
      validationResult.error.flatten().fieldErrors
    );
    return {
      success: false,
      message: "Validation failed.",
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  try {
    const updatedSupplier = await db.supplier.update({
      where: { id },
      data: validationResult.data,
    });
    revalidatePath("/suppliers"); // Update the cache
    revalidatePath(`/suppliers/${id}`); // Potentially update a details page cache if you have one
    return {
      success: true,
      message: "Supplier updated successfully.",
      supplier: updatedSupplier,
    };
  } catch (error: any) {
    console.error(`Failed to update supplier ${id}:`, error);
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      return {
        success: false,
        message: "A supplier with this name already exists.",
      };
    }
    if (error.code === "P2025") {
      return { success: false, message: "Supplier not found." };
    }
    return {
      success: false,
      message: "Database error: Failed to update supplier.",
    };
  }
}

// --- Toggle Supplier Status (Example of another action) ---
export async function toggleSupplierStatus(id: string, currentStatus: boolean) {
  if (!id) {
    return { success: false, message: "Supplier ID is required." };
  }
  try {
    const updatedSupplier = await db.supplier.update({
      where: { id },
      data: { isActive: !currentStatus },
    });
    revalidatePath("/suppliers");
    return {
      success: true,
      message: `Supplier ${updatedSupplier.isActive ? "activated" : "deactivated"}.`,
      supplier: updatedSupplier,
    };
  } catch (error: any) {
    console.error(`Failed to toggle status for supplier ${id}:`, error);
    if (error.code === "P2025") {
      return { success: false, message: "Supplier not found." };
    }
    return {
      success: false,
      message: "Database error: Failed to update status.",
    };
  }
}
