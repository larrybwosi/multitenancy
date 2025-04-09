// actions/stockActions.ts
"use server";

import { z } from "zod";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// --- Zod Schemas for Validation ---

const ProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().min(1, "SKU is required"),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  basePrice: z.coerce.number().min(0, "Base price must be non-negative"),
  reorderPoint: z.coerce
    .number()
    .int()
    .min(0, "Reorder point must be non-negative")
    .default(5),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).optional().default([]), // Basic URL validation
});

const EditProductSchema = ProductSchema.extend({
  id: z.string().cuid(), // Expecting CUID for existing product
});

const RestockSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional().nullable(), // Assuming variants might exist later
  batchNumber: z.string().optional().nullable(),
  initialQuantity: z.coerce
    .number()
    .int()
    .positive("Quantity must be positive"),
  purchasePrice: z.coerce
    .number()
    .min(0, "Purchase price must be non-negative"),
  expiryDate: z.coerce.date().optional().nullable(),
  location: z.string().optional().nullable(),
  purchaseItemId: z.string().cuid().optional().nullable(), // Optional link to purchase
});

// --- Helper Function for Error Handling ---
const handlePrismaError = (error: unknown): { error: string } => {
  console.error("Prisma Error:", error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors (e.g., unique constraint violation)
    if (error.code === "P2002") {
      const target = error.meta?.target as string[] | undefined;
      return {
        error: `A record with this ${target?.join(", ")} already exists.`,
      };
    }
    return { error: `Database error: ${error.code}` };
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    return { error: "Invalid data provided." };
  }
  return { error: "An unexpected error occurred." };
};

// --- Server Actions ---

export async function getProducts(
  options: { includeVariants?: boolean; includeCategory?: boolean } = {}
) {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: options.includeCategory ?? true,
        variants: options.includeVariants ?? false,
        // Calculate current stock approximately (sum of currentQuantity in batches)
        // This is a simplified calculation, a more robust solution might involve triggers or views
        _count: {
          select: { stockBatches: true }, // Count batches for now
        },
        stockBatches: {
          // Fetch currentQuantity sum
          select: { currentQuantity: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate total stock for each product
    const productsWithStock = products.map((p) => ({
      ...p,
      totalStock: p.stockBatches.reduce(
        (sum, batch) => sum + batch.currentQuantity,
        0
      ),
    }));

    return { products: productsWithStock };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { error: "Failed to fetch products." };
  }
}

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return { categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { error: "Failed to fetch categories." };
  }
}

export async function addProduct(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  
  const validatedFields = ProductSchema.safeParse({...rawData, isActive: true});

  if (!validatedFields.success) {
    console.error(
      "Validation Errors:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: "Validation failed.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const data = validatedFields.data;

  try {
    const newProduct = await prisma.product.create({
      data: {
        ...data,
        basePrice: new Prisma.Decimal(data.basePrice), // Convert to Decimal
        // Handle imageUrls if needed (e.g., upload logic would go here before saving URLs)
      },
    });
    revalidatePath("/stocks"); // Revalidate the stocks page
    return { success: true, product: newProduct };
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function updateProduct(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = EditProductSchema.safeParse({
    ...rawData,
    isActive: true,
  });

  if (!validatedFields.success) {
    console.error(
      "Validation Errors:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: "Validation failed.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id, ...data } = validatedFields.data;

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: id },
      data: {
        ...data,
        basePrice: new Prisma.Decimal(data.basePrice), // Convert to Decimal
        // Handle imageUrls update if needed
      },
    });
    revalidatePath("/stocks"); // Revalidate the stocks page
    revalidatePath(`/products/${id}`); // Example if you have a product details page
    return { success: true, product: updatedProduct };
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function addStockBatch(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  // Need to handle date conversion carefully
  const expiryDateStr = formData.get("expiryDate") as string | null;
  const parsedData = {
    ...rawData,
    expiryDate:
      expiryDateStr && expiryDateStr !== "" ? new Date(expiryDateStr) : null,
    initialQuantity: parseInt(
      (formData.get("initialQuantity") as string) || "0",
      10
    ),
    purchasePrice: parseFloat((formData.get("purchasePrice") as string) || "0"),
  };

  const validatedFields = RestockSchema.safeParse(parsedData);

  if (!validatedFields.success) {
    console.error(
      "Validation Errors:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: "Validation failed.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const data = validatedFields.data;

  try {
    // Use a transaction to ensure atomicity if needed (e.g., updating product total stock)
    const newBatch = await prisma.stockBatch.create({
      data: {
        productId: data.productId,
        variantId: data.variantId || undefined, // Prisma expects undefined, not null, for optional relations
        batchNumber: data.batchNumber || undefined,
        initialQuantity: data.initialQuantity,
        currentQuantity: data.initialQuantity, // Start with full quantity
        purchasePrice: new Prisma.Decimal(data.purchasePrice),
        expiryDate: data.expiryDate || undefined,
        location: data.location || undefined,
        purchaseItemId: data.purchaseItemId || undefined,
        // receivedDate is defaulted by Prisma
      },
    });

    // Optionally: Update an aggregated stock count on the Product model if you have one
    // await prisma.product.update({ where: { id: data.productId }, data: { totalStock: { increment: data.initialQuantity } } });

    revalidatePath("/stocks");
    return { success: true, batch: newBatch };
  } catch (error) {
    return handlePrismaError(error);
  }
}

export async function getStockBatches(
  options: {
    productId?: string;
    includeProduct?: boolean;
    activeOnly?: boolean;
  } = {}
) {
  try {
    const batches = await prisma.stockBatch.findMany({
      where: {
        productId: options.productId,
        currentQuantity: options.activeOnly ? { gt: 0 } : undefined,
      },
      include: {
        product: options.includeProduct ?? true,
        variant: true, // Include variant info if applicable
        purchaseItem: true, // Include link to purchase if exists
      },
      orderBy: {
        receivedDate: "desc",
      },
    });
    return { batches };
  } catch (error) {
    console.error("Error fetching stock batches:", error);
    return { error: "Failed to fetch stock batches." };
  }
}

export async function getPastStockBatches(
  options: { includeProduct?: boolean } = {}
) {
  try {
    // "Past" could mean batches with 0 current quantity or before a certain date
    // Here we fetch batches with 0 quantity
    const batches = await prisma.stockBatch.findMany({
      where: {
        currentQuantity: 0,
      },
      include: {
        product: options.includeProduct ?? true,
        variant: true,
        purchaseItem: true,
        saleItems: {
          // Include sale items that depleted this batch
          select: { id: true, quantity: true, saleId: true },
        },
      },
      orderBy: {
        receivedDate: "desc",
      },
      take: 100, // Limit results for performance
    });
    return { batches };
  } catch (error) {
    console.error("Error fetching past stock batches:", error);
    return { error: "Failed to fetch past stock batches." };
  }
}

// Add more actions as needed (delete product, update batch, stock adjustments, etc.)
// Remember to add validation and error handling for all actions.
