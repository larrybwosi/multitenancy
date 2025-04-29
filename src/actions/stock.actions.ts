'use server';

import prisma from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { Prisma, StockAdjustmentReason } from '@prisma/client';
import { getServerAuthContext } from './auth';
import { handleApiError } from '@/lib/api-utils';
import { CreateStockAdjustmentSchema } from '@/lib/validations/schemas';
import { RestockSchema } from '@/lib/validations/product';
import { convertToBaseUnit, generateBatchNumber, UNIT_DEFINITIONS } from '@/lib/unit-conversion';

export type LowStockItem = {
  type: 'product' | 'variant';
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

    products.forEach(p => {
      const baseStock = p.stockBatches.reduce((sum, batch) => sum + batch.currentQuantity, 0);

      if (p.reorderPoint !== null && baseStock <= p.reorderPoint) {
        if (p.variants.length === 0) {
          lowStockItems.push({
            type: 'product',
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

      p.variants.forEach(v => {
        const variantStock = v.stockBatches.reduce((sum, batch) => sum + batch.currentQuantity, 0);
        if (v.reorderPoint !== null && variantStock <= v.reorderPoint) {
          lowStockItems.push({
            type: 'variant',
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
    console.error('Error fetching low stock products:', error);
    return { error: 'Failed to fetch low stock products.' };
  }
}

export async function addStockBatch(formData: FormData) {
  const { organizationId } = await getServerAuthContext();
  const rawData = Object.fromEntries(formData.entries());

  const dataToValidate = {
    ...rawData,
    initialQuantity: rawData.initialQuantity,
    purchasePrice: rawData.purchasePrice,
    expiryDate: rawData.expiryDate && rawData.expiryDate !== '' ? new Date(rawData.expiryDate as string) : null,
  };

  const validatedFields = RestockSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    console.error('Validation Errors (addStockBatch):', validatedFields.error.flatten().fieldErrors);
    return {
      error: 'Validation failed.',
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

    revalidatePath('/inventory');
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
          product: includeProduct ? { select: { id: true, name: true, sku: true, basePrice: true } } : false,
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

    const cleanBatches: StockBatchWithDetails[] = batches.map(batch => ({
      ...batch,
      purchasePrice: batch.purchasePrice.toString(),
      product: batch.product ? { ...batch.product, basePrice: batch.product.basePrice.toString() } : null,
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
    console.error('Error fetching stock batches:', error);
    return { error: 'Failed to fetch stock batches.' };
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
    console.error('Validation Errors (adjustStock):', validatedFields.error.flatten().fieldErrors);
    return {
      error: 'Validation failed.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { productId, variantId, stockBatchId, locationId, quantity, reason, notes } = validatedFields.data;

  try {
    const result = await prisma.$transaction(async tx => {
      const batchToUpdate = await tx.stockBatch.findUnique({
        where: { id: stockBatchId },
        select: { currentQuantity: true, productId: true, variantId: true },
      });

      if (!batchToUpdate) {
        throw new Error('Stock batch not found.');
      }

      if (
        productId !== batchToUpdate.productId ||
        (variantId || undefined) !== (batchToUpdate.variantId || undefined)
      ) {
        throw new Error('Product/Variant mismatch with the specified stock batch.');
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
          locationId: locationId || '',
          quantity,
          reason,
          notes,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          variantId: variantId || '',
          organizationId,
          stockBatchId,
          quantity,
          memberId,
          movementType: 'ADJUSTMENT_IN',
          referenceId: adjustment.id,
          notes: `Reason: ${reason}. ${notes || ''}`.trim(),
        },
      });

      return adjustment;
    });

    revalidatePath('/inventory');
    revalidatePath(`/products/${productId}`);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('Error adjusting stock:', error);
    if (error instanceof Error) {
      if (
        error.message.includes('negative stock') ||
        error.message.includes('Stock batch not found') ||
        error.message.includes('Product/Variant mismatch')
      ) {
        return { error: error.message };
      }
    }
    return handleApiError(error);
  }
}

export async function getPastStockBatches(options: { includeProduct?: boolean } = {}) {
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
        receivedDate: 'desc',
      },
      take: 100,
    });
    return { batches };
  } catch (error) {
    console.error('Error fetching past stock batches:', error);
    return { error: 'Failed to fetch past stock batches.' };
  }
}

export async function getProductStock(productId: string, variantId?: string, locationId?: string) {
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

// Assuming RestockProductParams interface is defined elsewhere
interface RestockProductParams {
  productId: string;
  variantId?: string; // Optional variant ID
  unit: string; // Make sure 'unit' aligns with keys in UNIT_DEFINITIONS
  unitQuantity: number;
  locationId: string;
  supplierId?: string;
  purchaseItemId?: string;
  expiryDate?: Date;
  purchasePrice?: number;
  costPrice?: number;
  retailPrice?: number; // Note: retailPrice isn't directly used in stock models here
  notes?: string;
  actualDeliveryDate?: Date;
}

// Define types based on schema for clarity (adjust imports as needed)
type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true; defaultLocation: true };
}>;
type ProductVariant = Prisma.ProductVariantGetPayload<{}>;

export async function restockProduct(params: RestockProductParams) {
  const {
    productId,
    variantId: providedVariantId, // Rename for clarity
    unit,
    unitQuantity,
    locationId,
    supplierId,
    purchaseItemId,
    expiryDate,
    purchasePrice,
    costPrice,
    // retailPrice, // Not directly used in stock models
    notes,
    actualDeliveryDate,
  } = params;

  const { memberId, organizationId } = await getServerAuthContext();

  // 1. Validate the product and determine the target variant
  // Always include variants to handle both cases
  const product: ProductWithVariants | null = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: true, // Fetch all variants [cite: 40, 41]
      defaultLocation: true,
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  let targetVariant: ProductVariant | undefined;
  let targetVariantId: string;

  if (providedVariantId) {
    // If a specific variant ID is given, find it
    targetVariant = product.variants.find(v => v.id === providedVariantId);
    if (!targetVariant) {
      throw new Error(`Product variant with ID ${providedVariantId} not found for product ${product.name}`);
    }
    targetVariantId = targetVariant.id;
  } else {
    // If no variant ID is given, check if there's at least one variant (required by schema for ProductVariantStock)
    if (!product.variants || product.variants.length === 0) {
      // According to the schema, stock is tracked via ProductVariantStock, which requires a variant[cite: 133, 135].
      throw new Error(
        `Cannot restock product '${product.name}': Product must have at least one variant defined for stock tracking.`
      );
    }
    // Assume the first variant is the default/only one if none is specified
    targetVariant = product.variants[0];
    targetVariantId = targetVariant.id;
  }

  // 2. Convert quantity to base units
  // Ensure 'unit' exists in UNIT_DEFINITIONS before accessing
  if (!UNIT_DEFINITIONS[unit]) {
    throw new Error(`Invalid unit provided: ${unit}`);
  }
  const baseUnit = UNIT_DEFINITIONS[unit].baseUnit;
  const quantityInBaseUnits = convertToBaseUnit(unitQuantity, unit);

  // 3. Generate batch number (assuming helper exists)
  const batchNumber = generateBatchNumber(productId, targetVariantId); // Pass variantId too if needed

  // 4. Start Transaction
  return await prisma.$transaction(async tx => {
    // 4.1. Create StockBatch record
    const stockBatch = await tx.stockBatch.create({
      data: {
        productId,
        variantId: targetVariantId, // Use the determined target variant ID
        batchNumber,
        locationId,
        initialQuantity: quantityInBaseUnits,
        currentQuantity: quantityInBaseUnits,
        purchasePrice: purchasePrice ?? product.baseCost ?? 0, // Use provided, fallback to product cost, then 0
        expiryDate: expiryDate || null,
        receivedDate: actualDeliveryDate || new Date(),
        supplierId: supplierId || null, // Link supplier if provided [cite: 130]
        purchaseItemId: purchaseItemId || null, // Link purchase item if provided [cite: 123]
        organizationId,
        spaceOccupied: calculateSpaceOccupied(product, quantityInBaseUnits), // Helper function needed
        spaceUnit: product.dimensionUnit || 'CUBIC_METER', // Use product's unit or default [cite: 129, 36]
        // costPrice: costPrice ?? product.baseCost ?? purchasePrice ?? 0, // Use specific cost, fallback to base, fallback to purchase
        // landedCost: Calculate or set later [cite: 131]
      },
    });

    // 4.2. Upsert ProductVariantStock (inventory levels)
    const stockRecord = await tx.productVariantStock.upsert({
      where: {
        // Use the correct composite key [cite: 135]
        variantId_locationId: {
          variantId: targetVariantId,
          locationId,
        },
      },
      create: {
        productId,
        variantId: targetVariantId, // Use the determined target variant ID
        locationId,
        currentStock: quantityInBaseUnits,
        reservedStock: 0,
        availableStock: quantityInBaseUnits, // available = current - reserved [cite: 134]
        // Use variant-specific reorder points/qty, fallback to product defaults if needed, then schema defaults [cite: 40, 134]
        reorderPoint: targetVariant.reorderPoint ?? 5,
        reorderQty: targetVariant.reorderQty ?? 10,
        organizationId,
      },
      update: {
        currentStock: { increment: quantityInBaseUnits },
        availableStock: { increment: quantityInBaseUnits }, // available = current - reserved
        lastUpdated: new Date(),
      },
    });

    // 4.3. Create StockAdjustment record
    const adjustment = await tx.stockAdjustment.create({
      data: {
        productId,
        variantId: targetVariantId, // Use the determined target variant ID
        stockBatchId: stockBatch.id, // Link to the created batch [cite: 137]
        locationId,
        memberId,
        quantity: quantityInBaseUnits, // Positive for restock
        reason: supplierId ? 'RECEIVED_PURCHASE' : 'INVENTORY_COUNT', // Or INITIAL_STOCK? [cite: 138]
        notes: notes || `Restocked ${unitQuantity} ${unit} (${quantityInBaseUnits} base units)`,
        organizationId,
      },
    });

    // 4.4. Create StockMovement record
    const movement = await tx.stockMovement.create({
      data: {
        productId,
        variantId: targetVariantId, // Use the determined target variant ID
        stockBatchId: stockBatch.id, // Link to the batch being moved [cite: 145]
        quantity: quantityInBaseUnits,
        // Movement is INTO the target location, so 'from' is null (external)
        fromLocationId: null, // Null signifies stock coming from outside the tracked locations [cite: 146]
        toLocationId: locationId, // Destination is the specified location [cite: 148]
        movementType: supplierId ? 'PURCHASE_RECEIPT' : 'ADJUSTMENT_IN', // Or INITIAL_STOCK? [cite: 155]
        memberId,
        notes: notes || `Restocked ${unitQuantity} ${unit} into location ${locationId}`,
        organizationId,
        adjustmentId: adjustment.id, // Link to the adjustment record [cite: 152]
        referenceId: purchaseItemId || null, // Reference the purchase item if applicable [cite: 150]
        referenceType: purchaseItemId ? 'PurchaseItem' : null, // [cite: 151]
      },
    });

    // 4.5. Update ProductSupplier relationship if supplier provided
    if (supplierId) {
      await tx.productSupplier.upsert({
        where: {
          productId_supplierId: {
            // Correct composite key [cite: 51]
            productId,
            supplierId,
          },
        },
        create: {
          productId,
          supplierId,
          // Use provided cost, fallback to purchase price, fallback to product baseCost, then 0
          costPrice: costPrice ?? purchasePrice ?? product.baseCost ?? 0,
          minimumOrderQuantity: unitQuantity, // Default MOQ to the restocked quantity? Or require input? [cite: 49]
          packagingUnit: unit, // [cite: 50]
          isPreferred: false, // Default preferred to false [cite: 51]
        },
        update: {
          // Only update cost/packaging if explicitly provided or relevant
          costPrice: costPrice ?? purchasePrice ?? undefined, // Update cost if provided
          packagingUnit: unit, // Update packaging unit used in this restock
        },
      });
    }

    // 4.6. Create Audit Log
    await tx.auditLog.create({
      data: {
        action: 'CREATE', // Or maybe "UPDATE" if considering inventory level change? CREATE is for the batch.
        entityType: 'STOCK_BATCH', // Logging the creation of the batch [cite: 171]
        entityId: stockBatch.id, // ID of the created batch [cite: 175]
        memberId,
        organizationId,
        description: `Restocked product ${product.name} (${targetVariant.name}) - Batch ${batchNumber}`,
        details: {
          // [cite: 176]
          productId,
          variantId: targetVariantId,
          variantName: targetVariant.name,
          unit,
          unitQuantity,
          baseUnitQuantity: quantityInBaseUnits,
          locationId,
          batchNumber,
          expiryDate,
          supplierId,
          purchasePrice,
          costPrice,
          stockBatchId: stockBatch.id,
          adjustmentId: adjustment.id,
          movementId: movement.id,
        },
      },
    });

    // 5. Revalidate cache if using Next.js App Router
    revalidatePath('/products'); // Adjust path as needed
    revalidatePath(`/products/${productId}`);

    // 6. Return relevant created records
    return {
      stockBatch,
      stockRecord, // Return the updated/created stock level record
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

// Helper function to calculate space occupied (ensure Product type matches schema)
// Needs 'ProductWithVariants' type which includes dimensions
function calculateSpaceOccupied(product: ProductWithVariants, quantity: number): number | null {
  // Check if dimensions and unit exist [cite: 34, 35, 36]
  if (product.width == null || product.height == null || product.length == null || !product.dimensionUnit) {
    return null;
  }

  // Basic volume calculation - assumes dimensions are in meters if unit is CUBIC_METER
  // TODO: Add proper unit conversion if dimensionUnit is not meters
  const unitVolume = product.width * product.height * product.length;
  return unitVolume * quantity;
}