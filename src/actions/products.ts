"use server";

import { z } from "zod";
import prisma from "@/lib/db"; 
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getServerAuthContext } from "./auth";

// --- Zod Schemas for Validation ---

// const VariantAttributeSchema = z.object({
//   name: z.string().min(1, "Attribute name required"),
//   value: z.string().min(1, "Attribute value required"),
// });

// Helper for SKUs - Ensure uniqueness might require checking the DB in practice

// Example: Base Variant Schema (adjust fields as per your needs)
const VariantSchema = z.object({
  id: z.string().cuid().optional(), // Optional for creation
  name: z.string().min(1),
  sku: z.string().min(1),
  barcode: z.string().optional().nullable(),
  priceModifier: z.coerce.number(), // Coerce from string/number
  attributes: z.record(z.any()).optional(), // Basic JSON validation
  isActive: z.boolean().default(true),
  reorderPoint: z.coerce.number().int().positive().default(5),
  reorderQty: z.coerce.number().int().positive().default(10),
  lowStockAlert: z.boolean().default(false),
  // Ensure fields match your ProductVariant model
});

// Example: Product Schema for Creation
const ProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  sku: z.string().min(1),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().min(1),
  basePrice: z.coerce.number(), // Coerce from string/number
  reorderPoint: z.coerce.number().int().positive().default(5),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).optional(),
  variants: z.array(VariantSchema).optional().default([]), // Array of variants
  // Ensure fields match your Product model
});

// Define the actual type based on your Zod schema if needed elsewhere
type ProductVariantInput = z.infer<typeof VariantSchema>;



// Schema for editing includes the Product ID
const EditProductSchema = ProductSchema.extend({
  id: z.string().cuid(),
  // Allow variants to have IDs during update
  // variants: z.array(VariantSchema).optional().default([]),
});


// --- Helper Function for Error Handling ---
const handlePrismaError = (
  error: unknown
): { error: string; fieldErrors?: Record<string, string> } => {
  console.error("Prisma Error:", error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      const field = target ? target.join(", ") : "field";
      return {
        error: `A record with this ${field} already exists. Please use a unique value.`,
        fieldErrors: target
          ? { [target[0]]: `This ${target[0]} is already taken.` }
          : undefined,
      };
    }
    if (error.code === "P2025") {
      // Record to update not found
      return {
        error: "The record you tried to update or delete does not exist.",
      };
    }
    // Add more specific error codes as needed
    return {
      error: `Database error occurred (Code: ${error.code}). Please try again.`,
    };
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    // Data validation failed on Prisma's side (less common with Zod)
    return { error: "Invalid data format submitted. Please check your input." };
  }
  // Generic error for other cases
  return {
    error:
      "An unexpected error occurred. Please contact support if the problem persists.",
  };
};


/**
 * Utility to safely parse JSON from FormData
 */
function safeParseVariants(formData: FormData): ProductVariantInput[] | { error: string } {
    const variantsString = formData.get("variants") as string | null;
    if (!variantsString) {
        return []; // No variants provided is valid
    }
    try {
        // Add more robust validation if needed after parsing
        const parsed = JSON.parse(variantsString);
        if (!Array.isArray(parsed)) {
             return { error: "Variants data must be an array." };
        }
        // You might want to run Zod validation on each parsed item here too for extra safety
        return parsed as ProductVariantInput[];
    } catch (e) {
        console.error("Error parsing variants JSON:", e);
        return { error: "Invalid JSON format for variant data." };
    }
}

// --- Product Actions ---

/**
 * Fetches products with pagination, search, filtering, sorting, and stock counts.
 */
export async function getProducts(
  options: {
    includeVariants?: boolean;
    includeCategory?: boolean;
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    sortBy?: "name" | "createdAt" | "basePrice";
    sortOrder?: "asc" | "desc";
  } = {}
) {
  const {
    includeVariants = true,
    includeCategory = true,
    page = 1,
    limit = 10,
    search,
    categoryId,
    sortBy = "name",
    sortOrder = "asc",
  } = options;

    const { organizationId } = await getServerAuthContext();

  const where: Prisma.ProductWhereInput = {
    organizationId,
    category: {
      organizationId
    },
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        {
          variants: {
            some: { sku: { contains: search, mode: "insensitive" } },
          },
        },
      ],
    }),
    ...(categoryId && { categoryId }),
  };

  const skip = (page - 1) * limit;

  try {
    // Perform database operations within the context of the fetched organization
    const [products, totalProducts] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        include: {
          category: includeCategory,
          variants: includeVariants
            ? {
                include: {
                  stockBatches: {
                    select: { currentQuantity: true },
                    where: { currentQuantity: { gt: 0 } },
                  },
                },
                where: { isActive: true },
              }
            : false,
          stockBatches: {
            select: { currentQuantity: true },
            where: { variantId: null, currentQuantity: { gt: 0 } },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // --- Stock Calculation and Data Cleaning (remains the same) ---
    const productsWithStock = products.map((p) => {
      const baseStock = p.stockBatches.reduce(
        (sum, batch) => sum + batch.currentQuantity,
        0
      );
      const variantsWithStock =
        p.variants?.map((v) => {
          //@ts-expect-error This is fine
          const variantStockTotal = v.variantStock.reduce(
            //@ts-expect-error This is fine
            (sum, batch) => sum + batch.currentQuantity,
            0
          );
          return {
            ...v,
            priceModifier: v.priceModifier.toString(),
            totalStock: variantStockTotal,
            attributes: v.attributes
          };
        }) || [];
      const totalVariantStock = variantsWithStock.reduce(
        (sum, v) => sum + v.totalStock,
        0
      );

      return {
        ...p,
        basePrice: p.basePrice.toString(),
        totalStock: baseStock + totalVariantStock,
        variants: variantsWithStock,
        stockBatches: undefined,
        category: p.category ? { ...p.category } : undefined,
      };
    });
    // --- End Stock Calculation ---

    return {
      data: productsWithStock,
      meta: {
        totalProducts,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        pageSize: limit,
      },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    // Use the consistent error handling function if available
    // return handlePrismaError(error); // Or just return a simple error message
    return { error: "Failed to fetch products due to a database error." };
  }
}

export async function addProduct(formData: FormData) {
  const context = await getServerAuthContext();
  
  const { organizationId } = context; // userId could be used for createdById if needed

  const rawData = Object.fromEntries(formData.entries());

  // Handle JSON parsing for variants carefully
  const parsedVariantsResult = safeParseVariants(formData);
  if ("error" in parsedVariantsResult) {
    return parsedVariantsResult; // Return error object
  }
  const parsedVariants = parsedVariantsResult;

  // Prepare data for Zod validation (coercion happens within schema usually)
  const dataToValidate = {
    ...rawData,
    // Let Zod handle coercion for numbers/booleans if defined with z.coerce
    isActive: rawData.isActive === "on" || rawData.isActive === "true", // Explicit handling if schema doesn't coerce boolean
    imageUrls: formData
      .getAll("imageUrls")
      .filter(
        (url): url is string => typeof url === "string" && url.length > 0
      ),
    variants: parsedVariants.map((v) => ({
      ...v,
      // Let Zod handle coercion for numbers/booleans within VariantSchema
      isActive:
        typeof v.isActive === "boolean"
          ? v.isActive
          : v.isActive === "on" || v.isActive === "true", // Example explicit handling if needed
      lowStockAlert:
        typeof v.lowStockAlert === "boolean"
          ? v.lowStockAlert
          : v.lowStockAlert === "on" || v.lowStockAlert === "true", // Example explicit handling if needed
    })),
  };

  const validatedFields = ProductSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    console.error(
      "Validation Errors:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: "Validation failed. Please check your input.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Destructure validated data AFTER successful validation
  const { variants, categoryId, ...productData } = validatedFields.data;

  try {
    const newProduct = await prisma.product.create({
      data: {
        ...productData,
        organization: { connect: { id: organizationId } },
        // categoryId,
        category: { connect: { id: categoryId } }, // Connect relation
        // Convert numbers to Decimal *after* validation
        basePrice: new Prisma.Decimal(productData.basePrice),
        reorderPoint: productData.reorderPoint, // Already number via Zod coerce
        imageUrls: productData.imageUrls ?? [], // Use validated array
        isActive: productData.isActive, // Use validated boolean
        // Nested create for variants
        variants: {
          create: variants.map((v) => ({
            ...v,
            organization: { connect: { id: organizationId } },
            priceModifier: new Prisma.Decimal(v.priceModifier),
            attributes:
              (v.attributes as Prisma.InputJsonValue) ?? Prisma.JsonNull, // Cast/handle validated JSON
            // Use validated numbers/booleans directly
            reorderPoint: v.reorderPoint,
            reorderQty: v.reorderQty,
            isActive: v.isActive,
            lowStockAlert: v.lowStockAlert,
            // id: undefined, // Ensure ID is not passed for create
            barcode: v.barcode,
            name: v.name,
            sku: v.sku,
          })),
        },
        // Add createdById: context.userId if you have the relation setup via Member
      },
      include: { variants: true }, // Include variants in the returned object
    });
    console.log("New product created:", newProduct);

    revalidatePath("/products"); // Revalidate the products list page
    return { success: true, data: newProduct };
  } catch (error) {
    return handlePrismaError(error); // Use your specific error handler
  }
}

/**
 * Updates an existing product and manages its variants (create/update/delete).
 */
export async function updateProduct(formData: FormData) {
  const { organizationId } = await getServerAuthContext();
  const rawData = Object.fromEntries(formData.entries());
  const productId = rawData.id as string; // Get ID from form data

  if (!productId) return { error: "Product ID is missing." };

  // Handle JSON parsing for variants
  const parsedVariantsResult = safeParseVariants(formData);
  if ("error" in parsedVariantsResult) {
    return parsedVariantsResult;
  }
  const parsedVariants = parsedVariantsResult;

  // Prepare data for Zod validation
  const dataToValidate = {
    ...rawData,
    id: productId, // Include ID for validation
    // Let Zod handle coercion
    isActive: rawData.isActive === "on" || rawData.isActive === "true", // Explicit handling if schema doesn't coerce boolean
    imageUrls: formData
      .getAll("imageUrls")
      .filter(
        (url): url is string => typeof url === "string" && url.length > 0
      ),
    variants: parsedVariants.map((v) => ({
      ...v,
      id: v.id || undefined, // Keep ID if present, otherwise undefined
      // Let Zod handle coercion for numbers/booleans within VariantSchema
      isActive:
        typeof v.isActive === "boolean"
          ? v.isActive
          : v.isActive === "on" || v.isActive === "true",
      lowStockAlert:
        typeof v.lowStockAlert === "boolean"
          ? v.lowStockAlert
          : v.lowStockAlert === "on" || v.lowStockAlert === "true",
    })),
  };

  const validatedFields = EditProductSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    console.error(
      "Validation Errors:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: "Validation failed. Please check your input.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Destructure validated data
  const {
    id, // Same as productId, validated
    categoryId,
    variants: submittedVariants,
    ...productData
  } = validatedFields.data;

  try {
    // Use transaction for robustness when handling multiple variant operations
    const updatedProduct = await prisma.$transaction(
      async (tx) => {
        // 1. Get existing variant IDs associated with this product *within this organization*
        const existingVariants = await tx.productVariant.findMany({
          where: { productId: id, organizationId: organizationId }, // Ensure we only check variants for THIS product AND org
          select: { id: true },
        });
        const existingVariantIds = new Set(existingVariants.map((v) => v.id));

        // 2. Identify variants to create, update, and delete based on submitted data
        const variantsToCreate = submittedVariants.filter((v) => !v.id); // No ID means create
        const variantsToUpdate = submittedVariants.filter(
          (v) => v.id && existingVariantIds.has(v.id) // Has ID and it exists in DB
        );
        const submittedVariantIds = new Set(
          submittedVariants
            .map((v) => v.id)
            .filter((variantId): variantId is string => !!variantId) // Get IDs from submitted data
        );
        const variantsToDeleteIds = [...existingVariantIds].filter(
          (existingId) => !submittedVariantIds.has(existingId) // Existing IDs not in submission = delete
        );

        // 3. Perform deletions first
        if (variantsToDeleteIds.length > 0) {
          await tx.productVariant.deleteMany({
            where: {
              id: { in: variantsToDeleteIds },
              organizationId: organizationId,
            },
          });
        }

        // 4. Update the main product data
        // Ensure we only update within the correct organization
         await tx.product.update({
          where: { id: id, organizationId: organizationId },
          data: {
            ...productData,
            category: { connect: { id: categoryId } }, // Allow category change
            basePrice: new Prisma.Decimal(productData.basePrice), // Use validated & converted value
            reorderPoint: productData.reorderPoint,
            imageUrls: productData.imageUrls ?? [],
            isActive: productData.isActive,
            // DO NOT include 'variants' here - managed manually below
            // Add updatedById: context.userId if needed
          },
        });

        // 5. Perform creations
        if (variantsToCreate.length > 0) {
          await tx.productVariant.createMany({
            data: variantsToCreate.map((v) => ({
              // Map validated data for creation
              productId: id, // Link to the parent product
              organizationId: organizationId,
              name: v.name,
              sku: v.sku,
              barcode: v.barcode,
              isActive: v.isActive,
              priceModifier: new Prisma.Decimal(v.priceModifier),
              attributes:
                (v.attributes as Prisma.InputJsonValue) ?? Prisma.JsonNull,
              reorderPoint: v.reorderPoint,
              reorderQty: v.reorderQty,
              lowStockAlert: v.lowStockAlert,
            })),
          });
        }

        // 6. Perform updates (individually, as updateMany doesn't support varying data)
        for (const v of variantsToUpdate) {
          if (v.id) {
            // Type guard
            await tx.productVariant.update({
              where: {
                id: v.id,
                organizationId, // Ensure update is scoped to org
              },
              data: {
                // Map validated data for update
                name: v.name,
                sku: v.sku,
                barcode: v.barcode,
                isActive: v.isActive,
                priceModifier: new Prisma.Decimal(v.priceModifier),
                attributes:
                  (v.attributes as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                reorderPoint: v.reorderPoint,
                reorderQty: v.reorderQty,
                lowStockAlert: v.lowStockAlert,
                // updatedById: context.userId // If tracking variant updates
              },
            });
          }
        }

        // Fetch the final state of the product with its variants after all operations
        const finalProduct = await tx.product.findUnique({
          where: { id: id },
          include: { variants: true }, // Include updated variants
        });

        if (!finalProduct) {
          // This should ideally not happen if the initial update succeeded
          throw new Error(
            "Failed to retrieve updated product within transaction."
          );
        }

        return finalProduct; // Return the updated product with variants
      },
      {
        maxWait: 10000, // Optional: Max wait time for transaction lock
        timeout: 20000, // Optional: Max time for the transaction to run
      }
    );

    revalidatePath("/products");
    revalidatePath(`/products/${id}`); // Revalidate specific product page
    return { success: true, data: updatedProduct };
  } catch (error) {
    // Make sure handlePrismaError can understand transaction errors too
    return handlePrismaError(error);
  }
}
/**
 * Toggles the isActive status of a product.
 */
export async function toggleProductStatus(
  productId: string,
  isActive: boolean
) {
  // TODO: Auth checks
  if (!productId) return { error: "Product ID is required." };

  try {
    const updatedProduct = await prisma.product.update({
      where: { id: productId /* , organizationId: orgId */ }, // Add org check
      data: { isActive },
    });
    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    return { success: true, data: updatedProduct };
  } catch (error) {
    return handlePrismaError(error);
  }
}

// --- Variant Actions ---

/**
 * Fetches all active variants for a specific product, including stock counts.
 */
export async function getProductVariants(productId: string) {
  // TODO: Auth checks
  if (!productId) return { error: "Product ID is required." };

  try {
    const variants = await prisma.productVariant.findMany({
      where: { productId: productId, isActive: true }, // Fetch only active variants
      include: {
        // Include active stock batches for stock calculation
        stockBatches: {
          select: { currentQuantity: true },
          where: { currentQuantity: { gt: 0 } },
        },
        // product: { select: { name: true }} // Optionally include product name
      },
      orderBy: { name: "asc" }, // Order variants by name
    });

    // Calculate stock and convert decimals
    const variantsWithStock = variants.map((v) => ({
      ...v,
      priceModifier: v.priceModifier.toString(), // Convert Decimal
      totalStock: v.stockBatches.reduce(
        (sum, batch) => sum + batch.currentQuantity,
        0
      ),
      attributes: v.attributes, // Type assertion if needed for client
      stockBatches: undefined, // Don't send raw batches
    }));

    return { data: variantsWithStock };
  } catch (error) {
    console.error(`Error fetching variants for product ${productId}:`, error);
    return { error: "Failed to fetch product variants." };
  }
}

/**
 * Toggles the isActive status of a product variant.
 */
export async function toggleVariantStatus(
  variantId: string,
  isActive: boolean
) {
  // TODO: Auth checks
  if (!variantId) return { error: "Variant ID is required." };

  try {
    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive },
      select: { id: true, isActive: true, productId: true }, // Select needed fields
    });

    // Revalidate the product page where this variant might be shown
    revalidatePath(`/products/${updatedVariant.productId}`);
    return { success: true, data: updatedVariant };
  } catch (error) {
    return handlePrismaError(error);
  }
}


export async function deleteProduct(id: string) {
  const { organizationId } = await getServerAuthContext();
  try {
    await prisma.product.delete({
      where: { id, organizationId },
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
