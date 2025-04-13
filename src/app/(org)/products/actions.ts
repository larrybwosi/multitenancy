"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { productSchema, ProductFormData } from "./schema";

// --- Fetching Functions ---

export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true, // Include category details
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    // Convert Decimal fields to string or number for client components
    return products.map((p) => ({
      ...p,
      basePrice: p.basePrice.toString(), // Or .toNumber() if preferred
    }));
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return []; // Return empty array on error
  }
}

export async function getCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

// --- Mutation Functions ---

export async function createProduct(formData: ProductFormData) {
  const validationResult = productSchema.safeParse(formData);

  if (!validationResult.success) {
    console.error(
      "Validation Error:",
      validationResult.error.flatten().fieldErrors
    );
    return {
      success: false,
      message: "Invalid data provided.",
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const { imageUrl, ...data } = validationResult.data;

  try {
    await prisma.product.create({
      data: {
        ...data,
        // Store the single imageUrl in the array if provided
        imageUrls: imageUrl ? [imageUrl] : [],
        // Ensure basePrice is correctly typed if not handled by schema transform
        basePrice: new Prisma.Decimal(data.basePrice),
      },
    });
    revalidatePath("/products"); // Update the product list page
    return { success: true, message: "Product created successfully." };
  } catch (error) {
    console.error("Failed to create product:", error);
    // Handle potential unique constraint errors (e.g., SKU)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        // Unique constraint failed
        const target = (error.meta?.target as string[]) || [];
        if (target.includes("sku")) {
          return { success: false, message: "SKU already exists." };
        }
        if (target.includes("barcode")) {
          return { success: false, message: "Barcode already exists." };
        }
      }
    }
    return {
      success: false,
      message: "Database error: Failed to create product.",
    };
  }
}

export async function updateProduct(id: string, formData: ProductFormData) {
  const validationResult = productSchema.safeParse(formData);

  if (!validationResult.success) {
    console.error(
      "Validation Error:",
      validationResult.error.flatten().fieldErrors
    );
    return {
      success: false,
      message: "Invalid data provided.",
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const { imageUrl, ...data } = validationResult.data;

  try {
    await prisma.product.update({
      where: { id },
      data: {
        ...data,
        imageUrls: imageUrl ? [imageUrl] : [],
        basePrice: new Prisma.Decimal(data.basePrice), // Ensure correct type
      },
    });
    revalidatePath("/products");
    return { success: true, message: "Product updated successfully." };
  } catch (error) {
    console.error("Failed to update product:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes("sku")) {
          return { success: false, message: "SKU already exists." };
        }
        if (target.includes("barcode")) {
          return { success: false, message: "Barcode already exists." };
        }
      }
      if (error.code === "P2025") {
        // Record not found
        return { success: false, message: "Product not found." };
      }
    }
    return {
      success: false,
      message: "Database error: Failed to update product.",
    };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    });
    revalidatePath("/products");
    return { success: true, message: "Product deleted successfully." };
  } catch (error) {
    console.error("Failed to delete product:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle related records preventing deletion if necessary (e.g., P2014)
      if (error.code === "P2025") {
        // Record not found
        return { success: false, message: "Product not found." };
      }
      // Add more specific error handling if needed (e.g., foreign key constraints)
    }
    return {
      success: false,
      message: "Database error: Failed to delete product.",
    };
  }
}
