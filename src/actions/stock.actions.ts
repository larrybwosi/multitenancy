"use server";

import { z } from "zod";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma, StockAdjustmentReason } from "@prisma/client";
import { getServerAuthContext } from "./auth";
import { handleApiError } from "@/lib/api-utils";
import { CreateStockAdjustmentSchema } from "@/lib/validations/schemas";

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


// --- Server Actions ---


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
        location: data.location
          ? { connect: { id: data.location } }
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
    return handleApiError(error);
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

  const validatedFields = CreateStockAdjustmentSchema.safeParse(dataToValidate);

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
    locationId,
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
          memberId:userId, // Link to the Member performing the action
          locationId: locationId || '',
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
          // previousStock: previousStock,
          // newStock: newStock,
          // userId, // Member performing action
          memberId: userId,
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
    return handleApiError(error);
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
