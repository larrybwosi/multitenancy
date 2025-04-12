"use server";

import { z } from "zod";
import prisma from "@/lib/db"; 
import { revalidatePath } from "next/cache";
import { Prisma,  StockAdjustmentReason } from "@prisma/client";
import { getServerAuthContext } from "./auth";

// --- Zod Schemas for Validation ---

const VariantAttributeSchema = z.object({
  name: z.string().min(1, "Attribute name required"),
  value: z.string().min(1, "Attribute value required"),
});

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

// Schema for adding a stock batch (Restock)
const RestockSchema = z.object({
  productId: z.string().cuid("Valid Product ID required"),
  variantId: z.string().cuid().optional().nullable(), // Optional variant link
  batchNumber: z.string().optional().nullable(),
  initialQuantity: z.coerce
    .number()
    .int()
    .positive("Quantity must be a positive whole number"),
  purchasePrice: z.coerce
    .number()
    .min(0, "Purchase price must be non-negative"), // Coerce for input, convert later
  expiryDate: z.coerce.date().optional().nullable(),
  // Use locationId based on the schema relation
  locationId: z
    .string()
    .cuid("Valid Location ID required")
    .optional()
    .nullable(),
  purchaseItemId: z.string().cuid().optional().nullable(), // Link to purchase order item
});

// Schema for stock adjustments
const StockAdjustmentSchema = z.object({
  productId: z.string().cuid("Valid Product ID required"),
  variantId: z.string().cuid().optional().nullable(),
  stockBatchId: z.string().cuid("Valid Stock Batch ID required"), // Require specifying the batch for adjustment
  quantity: z
    .number()
    .int()
    .refine((val) => val !== 0, "Quantity change cannot be zero"), // Can be positive or negative
  // Use the imported Prisma enum type for validation
  reason: z.nativeEnum(StockAdjustmentReason),
  notes: z.string().optional(),
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
  
  const { organizationId } = context; // userId could be used for createdByI d if needed

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

// --- Stock Management Actions ---

/**
 * Adds a new stock batch for a product or variant.
 */
export async function addStockBatch(formData: FormData) {
  // const context = await getServerAuthContext();
  // const { organizationId, userId } = context;

  const rawData = Object.fromEntries(formData.entries());

  // Prepare data for validation
  const dataToValidate = {
    ...rawData,
    // Ensure numeric types are handled correctly by coerce
    initialQuantity: rawData.initialQuantity,
    purchasePrice: rawData.purchasePrice,
    // Parse date string if present
    expiryDate:
      rawData.expiryDate && rawData.expiryDate !== ""
        ? new Date(rawData.expiryDate as string)
        : null,
  };

  const validatedFields = RestockSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    console.error(
      "Validation Errors (addStockBatch):",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: "Validation failed.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const data = validatedFields.data;

  try {
    const newBatch = await prisma.stockBatch.create({
      //@ts-expect-error This is fine
      data: {
        productId: data.productId,
        variantId: data.variantId || undefined, // Use undefined if null/empty
        batchNumber: data.batchNumber || undefined,
        initialQuantity: data.initialQuantity,
        currentQuantity: data.initialQuantity, // Current quantity starts same as initial
        purchasePrice: new Prisma.Decimal(data.purchasePrice),
        expiryDate: data.expiryDate || undefined,
        // Connect to location using locationId
        location: data.locationId
          ? { connect: { id: data.locationId } }
          : undefined,
        // Connect to purchase item if ID is provided
        purchaseItem: data.purchaseItemId
          ? { connect: { id: data.purchaseItemId } }
          : undefined,
        // Add user/member relation if batch needs tracking
        // createdBy: { connect: { id: userId } },
      },
    });

    revalidatePath("/inventory"); // Or wherever stock is displayed
    revalidatePath(`/products/${data.productId}`);
    return { success: true, data: newBatch };
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Fetches stock batches with filtering and pagination.
 */
export async function getStockBatches(
  options: {
    productId?: string;
    variantId?: string | null; // Allow explicitly querying for base product batches (null)
    locationId?: string;
    includeProduct?: boolean;
    includeVariant?: boolean;
    activeOnly?: boolean; // Only batches with currentQuantity > 0
    expired?: boolean; // Filter by expiry date
    page?: number;
    limit?: number;
    organizationId?: string; // If batches are org-specific
  } = {}
) {
  const {
    productId,
    variantId, // If undefined, fetches all for product; if null, fetches base only; if string, fetches specific variant
    locationId,
    includeProduct = true,
    includeVariant = true,
    activeOnly = true,
    expired, // undefined = don't filter, true = expired, false = not expired
    page = 1,
    limit = 20,
  } = options;

  const skip = (page - 1) * limit;
  const now = new Date();

  const where: Prisma.StockBatchWhereInput = {
    ...(productId && { productId }),
    // Handle variantId filtering: undefined = no filter, null = base product, string = specific variant
    ...(variantId !== undefined && { variantId: variantId }),
    ...(locationId && { locationId }),
    ...(activeOnly && { currentQuantity: { gt: 0 } }),
    ...(expired === true && { expiryDate: { not: null, lt: now } }),
    ...(expired === false && {
      OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
    }),
    // product: { organizationId: organizationId } // Add org filtering if applicable
  };

  try {
    const [batches, totalBatches] = await prisma.$transaction([
      prisma.stockBatch.findMany({
        where,
        include: {
          product: includeProduct
            ? { select: { id: true, name: true, sku: true, basePrice: true } }
            : false,
          variant: includeVariant
            ? {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  priceModifier: true,
                },
              }
            : false,
          purchaseItem: { select: { id: true, purchaseId: true } }, // Include link to purchase if needed
          location: { select: { id: true, name: true } }, // Include location info
        },
        orderBy: {
          // Order by expiry date (soonest first), then received date
          expiryDate: "asc",
          receivedDate: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.stockBatch.count({ where }),
    ]);

    // Clean data for client, convert Decimals
    const cleanBatches = batches.map((batch) => ({
      ...batch,
      purchasePrice: batch.purchasePrice.toString(),
      product: batch.product
        ? { ...batch.product, basePrice: batch.product.basePrice.toString() }
        : null,
      variant: batch.variant
        ? {
            ...batch.variant,
            priceModifier: batch.variant.priceModifier.toString(),
          }
        : null,
      // Ensure nested objects are serializable if needed elsewhere
      purchaseItem: batch.purchaseItem ? { ...batch.purchaseItem } : null,
      location: batch.location ? { ...batch.location } : null,
    }));

    return {
      data: cleanBatches,
      meta: {
        totalBatches,
        totalPages: Math.ceil(totalBatches / limit),
        currentPage: page,
        pageSize: limit,
      },
    };
  } catch (error) {
    console.error("Error fetching stock batches:", error);
    return { error: "Failed to fetch stock batches." };
  }
}

/**
 * Adjusts stock for a SPECIFIC batch.
 */
export async function adjustStock(formData: FormData) {
  const { userId, organizationId } = await getServerAuthContext();

  const rawData = Object.fromEntries(formData.entries());

  // Prepare for validation
  const dataToValidate = {
    ...rawData,
    quantity: rawData.quantity, // Keep as string for coerce
    // Ensure userId is correctly passed and validated
    // userId: memberIdFromAuth, // Get this from session/auth context
  };

  const validatedFields = StockAdjustmentSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    console.error(
      "Validation Errors (adjustStock):",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      error: "Validation failed.",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Destructure validated data
  const {
    productId,
    variantId,
    stockBatchId,
    quantity,
    reason,
    notes,
  } = validatedFields.data;

  try {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find the batch to get current stock and lock it (implicitly via update)
      const batchToUpdate = await tx.stockBatch.findUnique({
        where: { id: stockBatchId },
        select: { currentQuantity: true, productId: true, variantId: true }, // Select necessary fields
      });

      if (!batchToUpdate) {
        throw new Error("Stock batch not found."); // Or handle more gracefully
      }

      // Optional: Verify productId/variantId match the batch if provided in form
      if (
        productId !== batchToUpdate.productId ||
        (variantId || undefined) !== (batchToUpdate.variantId || undefined)
      ) {
        throw new Error(
          "Product/Variant mismatch with the specified stock batch."
        );
      }

      const previousStock = batchToUpdate.currentQuantity;
      const newStock = previousStock + quantity;

      // Basic check: prevent stock going negative unnecessarily (unless reason allows it)
      if (
        newStock < 0 &&
        reason !== StockAdjustmentReason.LOST &&
        reason !== StockAdjustmentReason.STOLEN &&
        reason !== StockAdjustmentReason.DAMAGED &&
        reason !== StockAdjustmentReason.EXPIRED &&
        reason !== StockAdjustmentReason.RETURN_TO_SUPPLIER
      ) {
        throw new Error(
          `Adjustment results in negative stock (${newStock}) for batch ${stockBatchId}. Please check quantity or reason.`
        );
      }

      // 2. Update the stock batch quantity
      await tx.stockBatch.update({
        where: { id: stockBatchId },
        data: {
          currentQuantity: {
            increment: quantity, // Use increment for atomicity
          },
        },
      });

      // 3. Create the StockAdjustment record
      const adjustment = await tx.stockAdjustment.create({
        data: {
          productId, // Store the product ID on adjustment record
          organizationId,
          variantId: variantId || undefined, // Store variant ID if applicable
          stockBatchId, // Link adjustment to the specific batch
          userId, // Link to the Member performing the action
          quantity,
          reason,
          notes,
          // Store previous/new stock on adjustment for audit? (Optional - add fields to schema if needed)
          // previousQuantity: previousStock,
          // newQuantity: newStock,
        },
      });

      // 4. Create a StockMovement record for detailed logging
      await tx.stockMovement.create({
        data: {
          productId,
          variantId: variantId || '',
          organizationId,
          stockBatchId,
          quantity, // The change amount
          previousStock: previousStock,
          newStock: newStock,
          userId, // Member performing action
          referenceType: "ADJUSTMENT",
          referenceId: adjustment.id, // Link to the adjustment record
          notes: `Reason: ${reason}. ${notes || ""}`.trim(),
        },
      });

      return adjustment; // Return the created adjustment record
    });

    revalidatePath("/inventory"); // Or relevant stock page
    revalidatePath(`/products/${productId}`);
    return { success: true, data: result };
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    // Check for specific errors thrown in transaction
    console.error("Error adjusting stock:", error);
    if (
      error.message.includes("negative stock") ||
      error.message.includes("Stock batch not found") ||
      error.message.includes("Product/Variant mismatch")
    ) {
      return { error: error.message };
    }
    // Handle potential Prisma errors (like concurrent updates if not handled by increment)
    return handlePrismaError(error);
  }
}

/**
 * Fetches products considered "low stock" based on their reorder points.
 */
export async function getLowStockProducts() {
  // TODO: Auth checks
  try {
    // Fetch all active products (potentially filter by org)
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        // organizationId: organizationId // Add if products linked to org
      },
      include: {
        // Include base product batches (no variant link)
        stockBatches: {
          select: { currentQuantity: true },
          where: { variantId: null, currentQuantity: { gt: 0 } },
        },
        // Include variants and their batches
        variants: {
          where: { isActive: true },
          include: {
            stockBatches: {
              select: { currentQuantity: true },
              where: { currentQuantity: { gt: 0 } },
            },
          },
        },
      },
    });

    const lowStockItems: Array<{
      type: "product" | "variant";
      id: string;
      name: string;
      sku: string;
      currentStock: number;
      reorderPoint: number;
      productId: string;
      productName: string;
    }> = [];

    products.forEach((p) => {
      // Calculate base product stock
      const baseStock = p.stockBatches.reduce(
        (sum, batch) => sum + batch.currentQuantity,
        0
      );

      // Check if base product itself is low stock (only if no variants or if base product tracked separately)
      // This logic depends on whether base product SKU can be sold if variants exist.
      // Assuming base product stock matters if variants *don't* exist OR if explicitly tracked.
      // Let's simplify: check base product stock *if* it has a reorder point defined (implicitly meaning it's tracked).
      if (p.reorderPoint !== null && baseStock <= p.reorderPoint) {
        // Check if variants exist - if they do, maybe only variants matter? Depends on business logic.
        // For now, report base product low stock if below its reorder point.
        if (p.variants.length === 0) {
          // Only report base product if no variants exist
          lowStockItems.push({
            type: "product",
            id: p.id,
            name: p.name,
            sku: p.sku,
            currentStock: baseStock,
            reorderPoint: p.reorderPoint,
            productId: p.id,
            productName: p.name,
          });
        }
      }

      // Check each active variant for low stock
      p.variants.forEach((v) => {
        const variantStock = v.stockBatches.reduce(
          (sum, batch) => sum + batch.currentQuantity,
          0
        );
        if (v.reorderPoint !== null && variantStock <= v.reorderPoint) {
          lowStockItems.push({
            type: "variant",
            id: v.id,
            name: v.name,
            sku: v.sku,
            currentStock: variantStock,
            reorderPoint: v.reorderPoint,
            productId: p.id,
            productName: p.name,
          });
        }
      });
    });

    return { data: lowStockItems };
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return { error: "Failed to fetch low stock products." };
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
