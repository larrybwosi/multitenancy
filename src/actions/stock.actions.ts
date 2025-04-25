"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma, Product, StockAdjustmentReason } from "@prisma/client";
import { getServerAuthContext } from "./auth";
import { handleApiError } from "@/lib/api-utils";
import { CreateStockAdjustmentSchema } from "@/lib/validations/schemas";
import { RestockSchema } from "@/lib/validations/product";
import { convertToBaseUnit, generateBatchNumber, RestockProductParams, UNIT_DEFINITIONS } from "@/lib/unit-conversion";

export type LowStockItem = {
  type: "product" | "variant";
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  productId: string;
  productName: string;
};

export async function getLowStockProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        stockBatches: {
          select: { currentQuantity: true },
          where: { variantId: null, currentQuantity: { gt: 0 } },
        },
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

    const lowStockItems: LowStockItem[] = [];

    products.forEach((p) => {
      const baseStock = p.stockBatches.reduce(
        (sum, batch) => sum + batch.currentQuantity,
        0
      );

      if (p.reorderPoint !== null && baseStock <= p.reorderPoint) {
        if (p.variants.length === 0) {
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

export async function addStockBatch(formData: FormData) {
  const { organizationId } = await getServerAuthContext();
  const rawData = Object.fromEntries(formData.entries());

  const dataToValidate = {
    ...rawData,
    initialQuantity: rawData.initialQuantity,
    purchasePrice: rawData.purchasePrice,
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

  const { location, purchaseItemId, ...data } = validatedFields.data;

  try {
    const newBatch = await prisma.stockBatch.create({
      data: {
        organizationId,
        productId: data.productId,
        variantId: data.variantId || undefined,
        batchNumber: `LOT-${crypto.randomUUID().slice(0, 8)}`,
        initialQuantity: data.initialQuantity,
        currentQuantity: data.initialQuantity,
        purchasePrice: new Prisma.Decimal(data.purchasePrice),
        expiryDate: data.expiryDate || undefined,
        locationId: location,
        purchaseItemId: purchaseItemId,
        // purchaseItem: purchaseItemId
        //   ? { connect: { id: purchaseItemId } }
        //   : undefined,
        // location: location ? { connect: { id: location } } : undefined,
      },
    });

    revalidatePath("/inventory");
    revalidatePath(`/products/${data.productId}`);
    return { success: true, data: newBatch };
  } catch (error) {
    return handleApiError(error);
  }
}

export type StockBatchWithDetails = {
  id: string;
  productId: string;
  variantId: string | null;
  batchNumber: string | null;
  initialQuantity: number;
  currentQuantity: number;
  purchasePrice: string;
  expiryDate: Date | null;
  receivedDate: Date;
  product?: {
    id: string;
    name: string;
    sku: string;
    basePrice: string;
  } | null;
  variant?: {
    id: string;
    name: string;
    sku: string;
    priceModifier: string;
  } | null;
  purchaseItem?: {
    id: string;
    purchaseId: string;
  } | null;
  location?: {
    id: string;
    name: string;
  } | null;
};

export async function getStockBatches(
  options: {
    productId?: string;
    variantId?: string | null;
    locationId?: string;
    includeProduct?: boolean;
    includeVariant?: boolean;
    activeOnly?: boolean;
    expired?: boolean;
    page?: number;
    limit?: number;
  } = {}
) {
  const {
    productId,
    variantId,
    locationId,
    includeProduct = true,
    includeVariant = true,
    activeOnly = true,
    expired,
    page = 1,
    limit = 20,
  } = options;
  const { organizationId } = await getServerAuthContext();

  const skip = (page - 1) * limit;
  const now = new Date();

  const where: Prisma.StockBatchWhereInput = {
    organizationId,
    ...(productId && { productId }),
    ...(variantId !== undefined && { variantId }),
    ...(locationId && { locationId }),
    ...(activeOnly && { currentQuantity: { gt: 0 } }),
    ...(expired === true && { expiryDate: { not: null, lt: now } }),
    ...(expired === false && {
      OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
    }),
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
          purchaseItem: { select: { id: true, purchaseId: true } },
          location: { select: { id: true, name: true } },
        },
        // orderBy: {
        //   expiryDate: "asc",
        //   receivedDate: "asc",
        // },
        skip,
        take: limit,
      }),
      prisma.stockBatch.count({ where }),
    ]);

    const cleanBatches: StockBatchWithDetails[] = batches.map((batch) => ({
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

export async function adjustStock(formData: FormData) {
  const { memberId, organizationId } = await getServerAuthContext();
  const rawData = Object.fromEntries(formData.entries());

  const dataToValidate = {
    ...rawData,
    quantity: rawData.quantity,
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
    const result = await prisma.$transaction(async (tx) => {
      const batchToUpdate = await tx.stockBatch.findUnique({
        where: { id: stockBatchId },
        select: { currentQuantity: true, productId: true, variantId: true },
      });

      if (!batchToUpdate) {
        throw new Error("Stock batch not found.");
      }

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

      await tx.stockBatch.update({
        where: { id: stockBatchId },
        data: {
          currentQuantity: {
            increment: quantity,
          },
        },
      });

      const adjustment = await tx.stockAdjustment.create({
        data: {
          productId,
          organizationId,
          variantId: variantId || undefined,
          stockBatchId,
          memberId,
          locationId: locationId || "",
          quantity,
          reason,
          notes,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          variantId: variantId || "",
          organizationId,
          stockBatchId,
          quantity,
          memberId,
          movementType: "ADJUSTMENT_IN",
          referenceId: adjustment.id,
          notes: `Reason: ${reason}. ${notes || ""}`.trim(),
        },
      });

      return adjustment;
    });

    revalidatePath("/inventory");
    revalidatePath(`/products/${productId}`);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Error adjusting stock:", error);
    if (error instanceof Error) {
      if (
        error.message.includes("negative stock") ||
        error.message.includes("Stock batch not found") ||
        error.message.includes("Product/Variant mismatch")
      ) {
        return { error: error.message };
      }
    }
    return handleApiError(error);
  }
}

export async function getPastStockBatches(
  options: { includeProduct?: boolean } = {}
) {
  const { organizationId } = await getServerAuthContext();
  try {
    const batches = await prisma.stockBatch.findMany({
      where: {
        currentQuantity: 0,
        organizationId,
      },
      include: {
        product: options.includeProduct ?? true,
        variant: true,
        purchaseItem: true,
        saleItems: {
          select: { id: true, quantity: true, saleId: true },
        },
      },
      orderBy: {
        receivedDate: "desc",
      },
      take: 100,
    });
    return { batches };
  } catch (error) {
    console.error("Error fetching past stock batches:", error);
    return { error: "Failed to fetch past stock batches." };
  }
}

export async function getProductStock(
  productId: string,
  variantId?: string,
  locationId?: string
) {
  return await prisma.productVariantStock.findMany({
    where: {
      productId,
      variantId: variantId || undefined,
      locationId: locationId || undefined,
    },
    include: {
      location: true,
      variant: true,
    },
  });
}

export async function restockProduct(params: RestockProductParams) {
  const {
    productId,
    variantId,
    unit,
    unitQuantity,
    locationId,
    supplierId,
    purchaseItemId,
    expiryDate,
    purchasePrice,
    costPrice,
    retailPrice,
    notes,
    actualDeliveryDate,
  } = params;

  const { memberId, organizationId } = await getServerAuthContext();
  // Validate the product/variant exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: variantId ? { where: { id: variantId } } : false,
      defaultLocation: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  if (variantId && !product.variants?.length) {
    throw new Error("Product variant not found");
  }

  // Validate the location exists
  const location = await prisma.inventoryLocation.findUnique({
    where: { id: locationId },
  });

  if (!location) {
    throw new Error("Inventory location not found");
  }

  // Validate supplier if provided
  if (supplierId) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId, organizationId },
    });
    if (!supplier) {
      throw new Error("Supplier not found or not part of organization");
    }
  }

  // Convert to base units (pieces for count-based items)
  const baseUnit = UNIT_DEFINITIONS[unit].baseUnit;
  const quantityInBaseUnits = convertToBaseUnit(unitQuantity, unit);

  // Generate batch number
  const batchNumber = generateBatchNumber(organizationId, productId);

  // Start a transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Create a new StockBatch record
    const stockBatch = await tx.stockBatch.create({
      data: {
        productId,
        variantId: variantId || null,
        batchNumber,
        locationId,
        initialQuantity: quantityInBaseUnits,
        currentQuantity: quantityInBaseUnits,
        purchasePrice: purchasePrice || 0,
        expiryDate: expiryDate || null,
        receivedDate: actualDeliveryDate || new Date(),
        supplierId: supplierId || null,
        purchaseItemId: purchaseItemId || null,
        organizationId,
        spaceOccupied: calculateSpaceOccupied(product, quantityInBaseUnits),
        // spaceUnit: product.dimensionUnit as MeasurementUnit || "CUBIC_METER",
        spaceUnit: "CUBIC_METER",
      },
    });

    // 2. Update ProductVariantStock (inventory levels)
    // const stockRecord = await tx.productVariantStock.upsert({
    //   where: {
    //     variantId_locationId: {
    //       variantId: variantId || product.variants?.[0]?.id || productId,
    //       locationId,
    //     },
    //   },
    //   create: {
    //     productId,
    //     variantId: variantId || product.variants?.[0]?.id || productId,
    //     locationId,
    //     currentStock: quantityInBaseUnits,
    //     reservedStock: 0,
    //     availableStock: quantityInBaseUnits,
    //     reorderPoint: variantId
    //       ? product.variants?.[0]?.reorderPoint || 5
    //       : product.reorderPoint,
    //     reorderQty: variantId ? product.variants?.[0]?.reorderQty || 10 : 10,
    //     organizationId,
    //   },
    //   update: {
    //     currentStock: { increment: quantityInBaseUnits },
    //     availableStock: { increment: quantityInBaseUnits },
    //     lastUpdated: new Date(),
    //   },
    // });

    // 3. Create a StockAdjustment record
    const adjustment = await tx.stockAdjustment.create({
      data: {
        productId,
        variantId: variantId || null,
        stockBatchId: stockBatch.id,
        locationId,
        memberId,
        quantity: quantityInBaseUnits,
        reason: supplierId ? "RECEIVED_PURCHASE" : "INVENTORY_COUNT",
        notes:
          notes ||
          `Restocked ${unitQuantity} ${unit} (${quantityInBaseUnits} base units)`,
        organizationId,
      },
    });

    // 4. Create a StockMovement record
    const movement = await tx.stockMovement.create({
      data: {
        productId,
        variantId: variantId || null,
        stockBatchId: stockBatch.id,
        quantity: quantityInBaseUnits,
        movementType: supplierId ? "PURCHASE_RECEIPT" : "ADJUSTMENT_IN",
        memberId,
        notes: notes || `Restocked ${unitQuantity} ${unit}`,
        organizationId,
        adjustmentId: adjustment.id,
        referenceId: purchaseItemId || null,
        referenceType: purchaseItemId ? "PurchaseItem" : null,
      },
    });

    // 5. Update supplier product relationship if applicable
    if (supplierId) {
      await tx.productSupplier.upsert({
        where: {
          productId_supplierId: {
            productId,
            supplierId,
          },
        },
        create: {
          productId,
          supplierId,
          costPrice: costPrice || purchasePrice || 0,
          minimumOrderQuantity: unitQuantity,
          packagingUnit: unit,
          isPreferred: false,
        },
        update: {
          costPrice: costPrice || purchasePrice || undefined,
          packagingUnit: unit,
        },
      });
    }

    // 6. Create audit log
    await tx.auditLog.create({
      data: {
        action: "CREATE",
        entityType: "STOCK_BATCH",
        entityId: stockBatch.id,
        memberId,
        organizationId,
        description: `Restocked product ${product.name}${variantId ? ` variant` : ""}`,
        details: {
          productId,
          variantId,
          unit,
          unitQuantity,
          baseUnitQuantity: quantityInBaseUnits,
          locationId,
          batchNumber,
          expiryDate,
          supplierId,
          purchasePrice,
          costPrice,
          retailPrice,
        },
      },
    });

    revalidatePath('/products')
    return {
      stockBatch,
      // stockRecord,
      adjustment,
      movement,
      unitConversion: {
        fromUnit: unit,
        fromQuantity: unitQuantity,
        toUnit: baseUnit,
        toQuantity: quantityInBaseUnits,
        conversionFactor: UNIT_DEFINITIONS[unit].conversionFactor,
      },
    };
  });
}

// Helper function to calculate space occupied
function calculateSpaceOccupied(product: Product, quantity: number): number | null {
  if (!product.width || !product.height || !product.length) return null;

  const unitVolume = product.width * product.height * product.length;
  return unitVolume * quantity;
}