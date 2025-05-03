'use server';

import { z } from 'zod';
import { Prisma, ProductVariant } from '@prisma/client'; 
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getServerAuthContext } from './auth';
import { convertToBaseUnit, generateBatchNumber, UNIT_DEFINITIONS } from '@/lib/unit-conversion';

// --- Zod Schema for Input Validation ---

// Helper schema to ensure unit is a valid key in UNIT_DEFINITIONS
const validUnitSchema = z.custom<keyof typeof UNIT_DEFINITIONS>(
  val => typeof val === 'string' && val in UNIT_DEFINITIONS,
  {
    message: 'Invalid unit provided. Must be one of the defined units.',
  }
);

// Zod schema defining the expected input parameters for restocking
const RestockProductParamsSchema = z.object({
  productId: z.string().cuid({ message: 'Invalid Product ID format.' }),
  variantId: z.string().cuid({ message: 'Invalid Variant ID format.' }).optional(), // Optional: If not provided, defaults to the first variant if available
  unit: validUnitSchema, // Validate against defined units
  unitQuantity: z.number().positive({ message: 'Unit quantity must be a positive number.' }),
  locationId: z.string().cuid({ message: 'Invalid Location ID format.' }),
  supplierId: z.string().cuid({ message: 'Invalid Supplier ID format.' }).optional(),
  purchaseItemId: z.string().cuid({ message: 'Invalid Purchase Item ID format.' }).optional(), // Link to the specific purchase order item
  expiryDate: z.coerce.date().optional(), // Use coerce to handle potential string dates
  purchasePrice: z.number().nonnegative({ message: 'Purchase price cannot be negative.' }).optional(), // Price paid per unit *in the provided unit*
  notes: z.string().optional(),
  actualDeliveryDate: z.coerce.date().optional(), // Use coerce for flexibility
});

// --- Type Definitions based on Prisma Schema ---

// Define Prisma types for clarity and type safety, including relations needed
type ProductWithVariantsAndLocation = Prisma.ProductGetPayload<{
  include: {
    variants: {
      // Include necessary fields from variant for logic
      include: { suppliers: true }; // Include suppliers if needed for cost fallbacks, etc.
    };
    defaultLocation: true;
  };
}>;

// Define the structure of the validated parameters
type ValidatedRestockParams = z.infer<typeof RestockProductParamsSchema>;

// --- Error Handling ---

// Custom error class for better error identification
class RestockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RestockError';
  }
}

// --- Updated Restock Function ---

/**
 * Restocks a specific product variant at a given location.
 * Creates necessary stock batch, adjustment, and movement records within a transaction.
 * Updates inventory levels and optionally links to supplier and purchase information.
 * Validates input using Zod based on the schema constraints.
 *
 * @param {ValidatedRestockParams} unsafeParams - The raw input parameters for restocking.
 * @returns {Promise<object>} - An object containing the created/updated records.
 * @throws {RestockError} - Throws custom errors for validation failures or operational issues.
 * @throws {Error} - Throws standard errors for unexpected issues.
 */
export async function restockProduct(unsafeParams: unknown): Promise<object> {
  let validatedParams: ValidatedRestockParams;
  try {
    // 1. Validate Input Parameters using Zod Schema
    validatedParams = RestockProductParamsSchema.parse(unsafeParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Provide specific validation errors
      throw new RestockError(
        `Input validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    // Re-throw unexpected errors during validation
    throw error;
  }

  const {
    productId,
    variantId: providedVariantId,
    unit,
    unitQuantity,
    locationId,
    supplierId,
    purchaseItemId,
    expiryDate,
    purchasePrice, // Price per 'unit'
    // retailPrice is validated but not directly used in core stock logic here
    notes,
    actualDeliveryDate,
  } = validatedParams;

    const { memberId, organizationId } = await getServerAuthContext();

  // 3. Fetch Product and Target Variant Information
  const product: ProductWithVariantsAndLocation | null = await db.product.findUnique({
    where: { id: productId, organizationId }, // Ensure product belongs to the org
    include: {
      variants: {
        // Fetch all variants to find the target [cite: 38, 40, 41]
        include: {
          suppliers: true,
        },
      },
      defaultLocation: true, // May be useful contextually [cite: 37]
    },
  });

  if (!product) {
    throw new RestockError(`Product with ID ${productId} not found.`);
  }

  let targetVariant: ProductVariant | undefined;
  let targetVariantId: string;

  if (providedVariantId) {
    // If a specific variant ID is provided, find it within the product's variants
    targetVariant = product.variants.find(v => v.id === providedVariantId);
    if (!targetVariant) {
      throw new RestockError(
        `Product variant with ID ${providedVariantId} not found for product ${product.name} (ID: ${productId}).`
      );
    }
    targetVariantId = targetVariant.id;
  } else {
    // If no variant ID is provided, require at least one variant to exist
    if (!product.variants || product.variants.length === 0) {
      // Stock is tracked at the variant level via ProductVariantStock [cite: 130, 132]
      throw new RestockError(
        `Cannot restock product '${product.name}': It must have at least one variant defined for stock tracking.`
      );
    }
    // Default to the first variant if none is specified
    targetVariant = product.variants[0];
    targetVariantId = targetVariant.id;
    console.warn(
      `No variantId provided for product ${productId}. Defaulting to the first variant: ${targetVariantId} (${targetVariant.name}).`
    );
  }

  // 4. Validate Unit and Convert Quantity to Base Units
  let quantityInBaseUnits: number;
  let baseUnit: string;
  let conversionFactor: number;

  try {
    // unit is already validated by Zod to be a keyof UNIT_DEFINITIONS
    const unitDef = UNIT_DEFINITIONS[unit]; 
    baseUnit = unitDef.baseUnit;
    conversionFactor = unitDef.conversionFactor;
    quantityInBaseUnits = convertToBaseUnit(unitQuantity, unit); // Assumes this helper handles potential errors
  } catch (error) {
    // Catch errors from convertToBaseUnit if any
    throw new RestockError(
      `Error converting quantity to base units: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // 5. Generate Batch Number (Assuming helper exists)
  const batchNumber = generateBatchNumber(productId, targetVariantId); // Consider adding date/time for uniqueness

  // 6. Calculate Purchase Price per Base Unit (if applicable)
  // purchasePrice is per 'unit', need price per 'baseUnit' for StockBatch.purchasePrice
  const purchasePricePerBaseUnit =
    purchasePrice !== undefined ? purchasePrice / conversionFactor : (targetVariant.buyingPrice ?? 0); // Fallback to variant buying price[cite: 40], then 0

  // 7. Execute Database Operations within a Transaction
  try {
    const result = await db.$transaction(async tx => {
      // 7.1. Create StockBatch record
      const stockBatch = await tx.stockBatch.create({
        data: {
          variantId: targetVariantId, // Explicitly link to the variant [cite: 118]
          batchNumber, // [cite: 119]
          locationId, // [cite: 121]
          initialQuantity: quantityInBaseUnits, // [cite: 124] Quantity in base units
          currentQuantity: quantityInBaseUnits, // [cite: 124] Starts full
          purchasePrice: purchasePricePerBaseUnit, // Cost per *base unit* for this batch [cite: 125]
          expiryDate: expiryDate || null, // Optional expiry date [cite: 125]
          receivedDate: actualDeliveryDate || new Date(), // [cite: 125]
          supplierId: supplierId || null, // Optional link to supplier [cite: 127]
          purchaseItemId: purchaseItemId || null, // Optional link to purchase item [cite: 120]
          organizationId, // Associate with the organization [cite: 127]
          spaceOccupied: calculateSpaceOccupied(product, quantityInBaseUnits), // Requires helper function [cite: 126]
          spaceUnit: product.dimensionUnit || 'CUBIC_METER', // Use product's unit or default [cite: 35, 126]
          // landedCost: Calculate or set later if needed [cite: 128]
          // storageUnitId, positionId can be set later via separate move/placement logic [cite: 121, 123]
        },
      });

      // 7.2. Upsert ProductVariantStock (Update inventory levels for the variant at this location)
      const stockRecord = await tx.productVariantStock.upsert({
        where: {
          // Composite unique key for variant stock per location [cite: 132]
          variantId_locationId: {
            variantId: targetVariantId,
            locationId,
          },
          organizationId, // Ensure operating within the correct organization
        },
        create: {
          productId: product.id, // Link to parent product [cite: 130]
          variantId: targetVariantId, // Link to specific variant [cite: 130]
          locationId, // Link to location [cite: 130]
          currentStock: quantityInBaseUnits,
          reservedStock: 0, // New stock is not reserved
          availableStock: quantityInBaseUnits, // available = current - reserved [cite: 131]
          reorderPoint: targetVariant.reorderPoint ?? 5, // Use variant-specific settings or defaults [cite: 40, 131]
          reorderQty: targetVariant.reorderQty ?? 10, // Use variant-specific settings or defaults [cite: 40, 131]
          organizationId, // Associate with the organization [cite: 132]
        },
        update: {
          currentStock: { increment: quantityInBaseUnits },
          // availableStock calculation: available = current - reserved. Increment matches currentStock increment.
          availableStock: { increment: quantityInBaseUnits },
          lastUpdated: new Date(), // Update timestamp
        },
      });

      // Determine Reason/Type based on whether it's tied to a purchase
      const isPurchaseReceipt = !!purchaseItemId;
      const adjustmentReason = isPurchaseReceipt ? 'RECEIVED_PURCHASE' : 'INVENTORY_COUNT'; // Or INITIAL_STOCK if appropriate contextually [cite: 134, 138]
      const movementType = isPurchaseReceipt ? 'PURCHASE_RECEIPT' : 'ADJUSTMENT_IN'; // Or INITIAL_STOCK [cite: 144, 150]

      // 7.3. Create StockAdjustment record to log the change
      const adjustment = await tx.stockAdjustment.create({
        data: {
          variantId: targetVariantId, // Link to specific variant [cite: 133]
          stockBatchId: stockBatch.id, // Link adjustment to the created batch [cite: 133]
          locationId, // Location of adjustment [cite: 133]
          memberId, // Member performing the restock [cite: 133]
          quantity: quantityInBaseUnits, // Positive quantity for increase [cite: 134]
          reason: adjustmentReason, // Reason for the stock change [cite: 134]
          notes:
            notes || `Restocked ${unitQuantity} ${unit} (${quantityInBaseUnits} base units). Batch: ${batchNumber}.`, // [cite: 135]
          adjustmentDate: new Date(), // [cite: 135]
          organizationId, // Associate with the organization [cite: 137]
        },
      });

      // 7.4. Create StockMovement record to track inventory flow
      const movement = await tx.stockMovement.create({
        data: {
          variantId: targetVariantId, // Link to specific variant [cite: 139]
          stockBatchId: stockBatch.id, // Link movement to the specific batch [cite: 140]
          quantity: quantityInBaseUnits, // Quantity moved [cite: 141]
          fromLocationId: null, // Null signifies stock originating externally (supplier/adjustment) [cite: 141]
          toLocationId: locationId, // Destination is the specified restock location [cite: 143]
          movementType: movementType, // Type of movement [cite: 144]
          memberId, // Member responsible for the movement [cite: 149]
          notes: notes || `Received ${unitQuantity} ${unit} into location ${locationId}. Batch: ${batchNumber}.`, // [cite: 149]
          movementDate: new Date(), // [cite: 149]
          organizationId, // Associate with the organization [cite: 150]
          adjustmentId: adjustment.id, // Link movement to the adjustment record [cite: 147]
          referenceId: purchaseItemId || null, // Reference PurchaseItem ID if applicable [cite: 145]
          referenceType: purchaseItemId ? 'PurchaseItem' : null, // Type of reference [cite: 146]
        },
      });

      // 7.5. Upsert ProductSupplier relationship if supplier is provided
      // Note: Schema links ProductSupplier.productId to ProductVariant.id [cite: 46]
      // The unique constraint @@unique([productId, supplierId]) uses this field [cite: 50]
      // Ensure 'productId' variable below correctly holds the *variant* ID.
      if (supplierId) {
        await tx.productSupplier.upsert({
          where: {
            // Composite key using the 'productId' field (which is variantId) and supplierId [cite: 50]
            productId_supplierId: {
              productId: targetVariantId, // This field name refers to variantId in the relation [cite: 46]
              supplierId: supplierId,
            },
            // Cannot filter by organizationId directly in unique where, Prisma handles implicitly via relation
          },
          create: {
            productId: targetVariantId, // Link to the specific variant [cite: 46]
            supplierId, // Link to the supplier [cite: 46]
            costPrice: purchasePricePerBaseUnit ?? targetVariant.buyingPrice,
            packagingUnit: unit, // Record the unit used in this transaction [cite: 49]
            // Default MOQ to the restocked quantity? Risky assumption. Better to leave null or require input.
            minimumOrderQuantity: null, // Optional field [cite: 48]
            isPreferred: false, // Default new supplier links to not preferred [cite: 50]
            // supplierSku: Needs separate input if available [cite: 47]
          },
          update: {
            // Only update cost/packaging if relevant info provided in this restock
            costPrice: purchasePricePerBaseUnit ?? undefined,
            packagingUnit: unit, // Update packaging unit based on this restock
          },
        });
      }

      // 7.6. Create Audit Log entry for the restock action
      await tx.auditLog.create({
        data: {
          action: 'CREATE', // Action performed [cite: 166]
          entityType: 'STOCK_BATCH', // Entity affected [cite: 166, 171]
          entityId: stockBatch.id, // ID of the created batch [cite: 170]
          memberId, // Member performing the action [cite: 168]
          organizationId, // Organization context [cite: 167]
          description: `Restocked: ${product.name} (${targetVariant.name}) - Batch ${batchNumber} received at location ${locationId}.`, // [cite: 171]
          details: {
            // Store context relevant to the restock event [cite: 171]
            productId: product.id,
            productName: product.name,
            variantId: targetVariantId,
            variantName: targetVariant.name,
            sku: targetVariant.sku,
            unit,
            unitQuantity,
            baseUnit,
            baseUnitQuantity: quantityInBaseUnits,
            conversionFactor,
            locationId,
            batchNumber,
            expiryDate: expiryDate?.toISOString(),
            purchasePricePerUnit: purchasePrice,
            purchasePricePerBaseUnit: purchasePricePerBaseUnit,
            supplierId,
            purchaseItemId,
            stockBatchId: stockBatch.id,
            stockRecordId: stockRecord.id,
            adjustmentId: adjustment.id,
            movementId: movement.id,
            receivedDate: stockBatch.receivedDate.toISOString(),
          },
          performedAt: new Date(), // Timestamp of the audit log [cite: 172]
        },
      });

      // 8. Return the created/updated records and conversion details
      return {
        stockBatch,
        stockRecord, // Return the updated/created inventory level record
        adjustment,
        movement,
        unitConversion: {
          fromUnit: unit,
          fromQuantity: unitQuantity,
          toUnit: baseUnit,
          toQuantity: quantityInBaseUnits,
          conversionFactor: conversionFactor,
        },
        targetVariantInfo: {
          id: targetVariant.id,
          name: targetVariant.name,
          sku: targetVariant.sku,
        },
      };
    }); // End Transaction

    // 9. Revalidate Cache (if using Next.js App Router)
    // Invalidate paths related to inventory and product details
    revalidatePath('/inventory'); // Adjust paths as needed
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/inventory/locations/${locationId}`);

    return result;
  } catch (error) {
    // Handle potential errors during the transaction or post-transaction steps
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors (e.g., unique constraint violations)
      console.error('Prisma Error during restock:', error.code, error.message);
      throw new RestockError(`Database error during restock: ${error.message} (Code: ${error.code})`);
    } else if (error instanceof RestockError) {
      // Re-throw custom errors from earlier steps
      throw error;
    } else {
      // Handle unexpected errors
      console.error('Unexpected error during restock:', error);
      throw new Error(
        `An unexpected error occurred during the restock process: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true; defaultLocation: true };
}>;

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

// --- Example Usage (requires async context) ---
/*
async function runRestockExample() {
  try {
    const restockData = {
      variantId: 'clerk_variant_id_456', // Optional, replace with actual ID
      unit: 'CASE', // Must exist in UNIT_DEFINITIONS
      unitQuantity: 5,
      locationId: 'clerk_location_id_789', // Replace with actual ID
      supplierId: 'clerk_supplier_id_abc', // Optional
      purchaseItemId: 'clerk_purchaseitem_id_def', // Optional
      purchasePrice: 50.00, // Price per CASE
      expiryDate: new Date('2025-12-31'), // Optional
      notes: 'Received shipment ABC-123', // Optional
    };

    // Assume restockProduct is called within an authenticated context
    const result = await restockProduct(restockData);
    console.log('Restock successful:', result);

  } catch (error) {
    console.error('Restock failed:', error instanceof Error ? error.message : String(error));
    if (error instanceof RestockError) {
      // Handle specific restock errors
    }
  }
}

// runRestockExample();
*/
