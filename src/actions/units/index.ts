import { ProductVariant, UnitOfMeasure, UnitType, MovementType, Prisma, PrismaClient } from '@/prisma/client';
import prisma from '@/lib/db';

// --- Unit System Configuration ---

interface CreateUnitOfMeasureInput {
  name: string;
  symbol: string;
  organizationId: string;
  unitType?: UnitType;
  baseUnitId?: string; // ID of the unit this one is derived from (e.g., "Piece" for "Dozen")
  conversionFactor?: number; // How many baseUnits make one of this unit (e.g., 12 for "Dozen")
}

/**
 * Creates a new unit of measure.
 * @param data - The data for the new unit.
 * @returns The created unit of measure.
 * * Example:
 * // Create a base unit "Piece"
 * await createUnitOfMeasure({ name: "Piece", symbol: "pc", organizationId: "org_1", unitType: UnitType.COUNT });
 * // Create a derived unit "Dozen"
 * await createUnitOfMeasure({ name: "Dozen", symbol: "dz", organizationId: "org_1", unitType: UnitType.COUNT, baseUnitId: "piece_unit_id", conversionFactor: 12 });
 */
export async function createUnitOfMeasure(data: CreateUnitOfMeasureInput): Promise<UnitOfMeasure> {
  const { name, symbol, organizationId, unitType = UnitType.COUNT, baseUnitId, conversionFactor } = data;

  if (baseUnitId && (conversionFactor === undefined || conversionFactor <= 0)) {
    throw new Error('Conversion factor must be a positive number for derived units.');
  }
  if (!baseUnitId && conversionFactor !== undefined) {
    throw new Error('Conversion factor should only be provided for derived units (when baseUnitId is set).');
  }

  return prisma.unitOfMeasure.create({
    data: {
      name,
      symbol,
      organizationId,
      unitType,
      baseUnitId: baseUnitId || null,
      conversionFactor: conversionFactor ? new Prisma.Decimal(conversionFactor) : null,
    },
  });
}

interface ConfigureProductVariantUnitsInput {
  productVariantId: string;
  baseUnitId: string; // e.g., "Piece"
  stockingUnitId: string; // e.g., "Case of 24 Pieces"
  sellingUnitId: string; // e.g., "Piece" or "Pack of 6 Pieces"
}

/**
 * Configures the base, stocking, and selling units for a product variant.
 * All inventory quantities will be tracked in the 'baseUnit'.
 * buyingPrice should correspond to 'stockingUnit'.
 * retailPrice should correspond to 'sellingUnit'.
 * @param data - The unit configuration for the product variant.
 * @returns The updated product variant.
 */
export async function configureProductVariantUnits(data: ConfigureProductVariantUnitsInput): Promise<ProductVariant> {
  const { productVariantId, baseUnitId, stockingUnitId, sellingUnitId } = data;

  // Optional: Validate that the units exist and belong to the same organization as the product variant.
  // Optional: Validate that stocking and selling units can be converted to the base unit.

  return prisma.productVariant.update({
    where: { id: productVariantId },
    data: {
      baseUnitId,
      stockingUnitId,
      sellingUnitId,
    },
  });
}


/**
 * Fetches all units of measure for a given organization.
 * @param organizationId - The ID of the organization
 * @returns Array of UnitOfMeasure objects
 */
export async function getUnitsOfMeasure(organizationId: string) {
  try {
    const units = await prisma.unitOfMeasure.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        name: true,
        symbol: true,
        unitType: true,
        baseUnitId: true,
        conversionFactor: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc', // Sort alphabetically by name
      },
    });
    return units;
  } catch (error) {
    console.error('Error fetching units of measure:', error);
    throw new Error('Failed to fetch units of measure');
  }
}

// --- Unit Conversion Helper Functions ---

/**
 * Helper function to get the conversion factor from a source unit to a target base unit.
 * It traverses up the unit hierarchy (e.g., from "Case" to "Pack" to "Piece").
 * @param sourceUnitId - The ID of the unit to convert from.
 * @param targetBaseUnitId - The ID of the base unit to convert to.
 * @returns The total conversion factor (how many targetBaseUnits are in one sourceUnit).
 */
async function getFactorToConvertToBase(sourceUnitId: string, targetBaseUnitId: string): Promise<Prisma.Decimal> {
  if (sourceUnitId === targetBaseUnitId) {
    return new Prisma.Decimal(1);
  }

  let currentUnitId = sourceUnitId;
  let accumulatedFactor = new Prisma.Decimal(1);

  const visitedUnits = new Set<string>(); // To detect cycles

  while (currentUnitId && currentUnitId !== targetBaseUnitId) {
    if (visitedUnits.has(currentUnitId)) {
      throw new Error(`Cycle detected in unit conversion hierarchy for unit ${sourceUnitId}.`);
    }
    visitedUnits.add(currentUnitId);

    const unit = await prisma.unitOfMeasure.findUnique({
      where: { id: currentUnitId },
    });

    if (!unit) {
      throw new Error(`Unit with ID ${currentUnitId} not found during conversion.`);
    }
    if (!unit.baseUnitId || !unit.conversionFactor) {
      throw new Error(
        `Unit ${unit.name} (ID: ${unit.id}) is not the target base unit and lacks a baseUnitId or conversionFactor for further conversion.`
      );
    }

    accumulatedFactor = accumulatedFactor.mul(unit.conversionFactor);
    currentUnitId = unit.baseUnitId;
  }

  if (currentUnitId !== targetBaseUnitId) {
    throw new Error(
      `Cannot convert unit ${sourceUnitId} to target base unit ${targetBaseUnitId}. Ensure a valid conversion path exists.`
    );
  }

  return accumulatedFactor; // This factor means: 1 sourceUnit = X targetBaseUnits
}

/**
 * Converts a quantity from a source unit to the product variant's defined base unit.
 * @param quantity - The quantity in the source unit.
 * @param sourceUnitId - The ID of the unit the quantity is currently in.
 * @param variantBaseUnitId - The ID of the product variant's base unit.
 * @returns The quantity expressed in the variant's base unit.
 */
async function convertQuantityToVariantBase(
  quantity: Prisma.Decimal,
  sourceUnitId: string,
  variantBaseUnitId: string
): Promise<Prisma.Decimal> {
  const factor = await getFactorToConvertToBase(sourceUnitId, variantBaseUnitId);
  return quantity.mul(factor);
}

/**
 * Converts a price from a 'per source unit' to 'per variant base unit'.
 * @param pricePerSourceUnit - The price for one source unit.
 * @param sourceUnitId - The ID of the unit the price is currently for.
 * @param variantBaseUnitId - The ID of the product variant's base unit.
 * @returns The price expressed per variant's base unit.
 */
async function convertPriceToPerVariantBase(
  pricePerSourceUnit: Prisma.Decimal,
  sourceUnitId: string,
  variantBaseUnitId: string
): Promise<Prisma.Decimal> {
  const factor = await getFactorToConvertToBase(sourceUnitId, variantBaseUnitId);
  if (factor.isZero()) {
    throw new Error('Conversion factor is zero, cannot divide by zero for price conversion.');
  }
  return pricePerSourceUnit.div(factor);
}

// --- Bulk Restocking System ---

interface RestockItemInput {
  productVariantId: string;
  quantityInRestockUnit: number; // Quantity in the unit specified by restockUnitId
  restockUnitId: string; // The unit of measure for the quantity being restocked (e.g., "Case ID")
  purchasePricePerRestockUnit?: number; // Cost for one restockUnit (e.g., price per Case)
  expiryDate?: Date;
  batchNumber?: string; // [cite: 158]
  supplierId?: string; // [cite: 166]
  purchaseItemId?: string; // Optional: if this restock is tied to a specific purchase order item [cite: 159]
}

interface BulkRestockInput {
  items: RestockItemInput[];
  locationId: string; // Inventory location ID where stock is being added [cite: 121]
  memberId: string; // Member ID performing the restock [cite: 11]
  organizationId: string;
  restockDate?: Date; // Defaults to now()
  notes?: string; // [cite: 174]
  movementType?: MovementType; // e.g., PURCHASE_RECEIPT, INITIAL_STOCK. Defaults to PURCHASE_RECEIPT
}

/**
 * Performs bulk restocking of products.
 * Creates StockBatch records for each item and updates ProductVariantStock.
 * All quantities in StockBatch and ProductVariantStock are stored in the ProductVariant's base unit.
 * @param data - The bulk restocking input data.
 * @returns A summary of the restocking operation (e.g., number of items restocked).
 */
export async function bulkRestockProducts(data: BulkRestockInput): Promise<{
  success: boolean;
  message: string;
  createdBatches: number;
  stockMovements: number;
}> {
  const {
    items,
    locationId,
    memberId,
    organizationId,
    restockDate = new Date(),
    notes,
    movementType = MovementType.PURCHASE_RECEIPT,
  } = data;

  if (!items || items.length === 0) {
    return { success: false, message: 'No items provided for restocking.', createdBatches: 0, stockMovements: 0 };
  }

  let createdBatchesCount = 0;
  let stockMovementsCount = 0;

  await prisma.$transaction(async tx => {
    for (const item of items) {
      const productVariant = await tx.productVariant.findUnique({
        where: { id: item.productVariantId },
        select: { baseUnitId: true, }, // Ensure variant belongs to the specified org
      });

      if (!productVariant) {
        throw new Error(`ProductVariant with ID ${item.productVariantId} not found.`);
      }
      // if (productVariant.organizationId !== organizationId) {
      //   throw new Error(`ProductVariant ${item.productVariantId} does not belong to organization ${organizationId}.`);
      // }

      const quantityInRestockUnit = new Prisma.Decimal(item.quantityInRestockUnit);
      if (quantityInRestockUnit.lessThanOrEqualTo(0)) {
        console.warn(`Skipping item ${item.productVariantId} due to non-positive quantity.`);
        continue;
      }

      // 1. Convert quantity to the variant's base unit
      const quantityInBaseUnit = await convertQuantityToVariantBase(
        quantityInRestockUnit,
        item.restockUnitId,
        productVariant.baseUnitId
      );

      // 2. Convert purchase price to 'per base unit'
      let purchasePricePerBaseUnit: Prisma.Decimal | null = null;
      if (item.purchasePricePerRestockUnit !== undefined) {
        purchasePricePerBaseUnit = await convertPriceToPerVariantBase(
          new Prisma.Decimal(item.purchasePricePerRestockUnit),
          item.restockUnitId,
          productVariant.baseUnitId
        );
      }

      // 3. Create StockBatch
      const stockBatch = await tx.stockBatch.create({
        data: {
          variantId: item.productVariantId,
          batchNumber: item.batchNumber,
          purchaseItemId: item.purchaseItemId,
          locationId,
          initialQuantity: quantityInBaseUnit.round().toNumber(), // Prisma Int expects number
          currentQuantity: quantityInBaseUnit.round().toNumber(),
          purchasePrice: purchasePricePerBaseUnit || 0, // This is Prisma.Decimal, matches schema [cite: 164]
          expiryDate: item.expiryDate, // [cite: 164]
          receivedDate: restockDate,
          organizationId,
          supplierId: item.supplierId,
          // spaceOccupied and landedCost can be added if available [cite: 165, 167]
        },
      });
      createdBatchesCount++;

      // 4. Update ProductVariantStock
      const existingStock = await tx.productVariantStock.findUnique({
        where: {
          variantId_locationId: {
            // [cite: 171] for unique constraint
            variantId: item.productVariantId,
            locationId,
          },
        },
      });

      if (existingStock) {
        await tx.productVariantStock.update({
          where: { id: existingStock.id },
          data: {
            currentStock: { increment: quantityInBaseUnit.round().toNumber() },
            // availableStock might need re-evaluation based on reservations, or simply increment as well
            // For simplicity, we assume availableStock = currentStock - reservedStock
            // And reservedStock is managed by other processes (like order placement)
            // So, just updating currentStock should be fine and availableStock can be a calculated field or updated via trigger.
            // Let's assume availableStock is also directly incremented here if not explicitly managed as current - reserved.
            // The schema has availableStock @default(0) // Calculated: currentStock - reservedStock [cite: 170]
            // So we only need to update currentStock.
          },
        });
      } else {
        // Create ProductVariantStock if it doesn't exist
        await tx.productVariantStock.create({
          data: {
            productId: (
              await tx.productVariant.findUniqueOrThrow({
                where: { id: item.productVariantId },
                select: { productId: true },
              })
            ).productId,
            variantId: item.productVariantId,
            locationId,
            currentStock: quantityInBaseUnit.round().toNumber(),
            availableStock: quantityInBaseUnit.round().toNumber(), // Initial available stock
            organizationId,
            // reorderPoint, reorderQty can use defaults or be set if provided [cite: 170]
          },
        });
      }

      // 5. Create StockMovement record [cite: 178]
      await tx.stockMovement.create({
        data: {
          variantId: item.productVariantId,
          stockBatchId: stockBatch.id,
          quantity: quantityInBaseUnit.round().toNumber(), // Always positive, in base units
          // fromLocationId: null for new stock, or supplier location if tracked
          toLocationId: locationId,
          movementType: movementType,
          referenceId: item.purchaseItemId || stockBatch.id, // Link to purchase or batch itself
          referenceType: item.purchaseItemId ? 'PurchaseItem' : 'StockBatch',
          memberId,
          movementDate: restockDate,
          notes: notes || `Restocked ${item.quantityInRestockUnit} ${item.restockUnitId}`,
          organizationId,
        },
      });
      stockMovementsCount++;
    }
  });

  return {
    success: true,
    message: `Successfully restocked ${items.length} product variant types. Created ${createdBatchesCount} batches and ${stockMovementsCount} stock movements.`,
    createdBatches: createdBatchesCount,
    stockMovements: stockMovementsCount,
  };
}

/**
 * Seeds organization units of measure into the database, including base and derived units.
 * Ensures atomicity using transactions and handles duplicates gracefully.
 * @param organizationId - The UUID of the organization to seed units for.
 * @param prisma - The PrismaClient instance for database operations.
 * @throws Error if organizationId is invalid or database operations fail.
 */


interface UnitSeedData {
  name: string;
  symbol: string;
  unitType: UnitType;
  organizationId: string;
  baseUnitName?: string;
  conversionFactor?: Prisma.Decimal;
}

/**
 * Seeds default units of measure for an organization.
 * Can be used standalone or within an existing Prisma transaction.
 * @param organizationId - The organization ID.
 * @param prismaClient - The Prisma client (required).
 * @param tx - Optional Prisma transaction client.
 * @returns A Promise that resolves when seeding is complete.
 * @throws Error if seeding fails or inputs are invalid.
 */
export async function seedOrganizationUnits(
  organizationId: string,
  prismaClient: PrismaClient,
  tx?: Prisma.TransactionClient
): Promise<void> {
  // Validate inputs
  if (!organizationId) {
    throw new Error('Invalid or missing organizationId. Must be a valid UUID.');
  }
  if (!prismaClient) {
    throw new Error('PrismaClient instance is required.');
  }

  const unitsToCreate: UnitSeedData[] = [
    // Countable Units
    {
      name: 'Piece',
      symbol: 'pc',
      unitType: UnitType.COUNT,
      organizationId,
    },
    {
      name: 'Pack',
      symbol: 'pk',
      unitType: UnitType.COUNT,
      organizationId,
      baseUnitName: 'Piece',
      conversionFactor: new Prisma.Decimal(10),
    },
    {
      name: 'Dozen',
      symbol: 'dz',
      unitType: UnitType.COUNT,
      organizationId,
      baseUnitName: 'Piece',
      conversionFactor: new Prisma.Decimal(12),
    },
    {
      name: 'Case',
      symbol: 'cs',
      unitType: UnitType.COUNT,
      organizationId,
    },
    // Weight Units
    {
      name: 'Gram',
      symbol: 'g',
      unitType: UnitType.WEIGHT,
      organizationId,
    },
    {
      name: 'Kilogram',
      symbol: 'kg',
      unitType: UnitType.WEIGHT,
      organizationId,
      baseUnitName: 'Gram',
      conversionFactor: new Prisma.Decimal(1000),
    },
  ];

  try {
    // Define the unit seeding logic
    const seedUnits = async (client: PrismaClient | Prisma.TransactionClient) => {
      // Separate base and derived units
      const baseUnits = unitsToCreate.filter(unit => !unit.baseUnitName);
      const derivedUnits = unitsToCreate.filter(unit => unit.baseUnitName);

      // Create base units first
      for (const unitData of baseUnits) {
        const existingUnit = await client.unitOfMeasure.findFirst({
          where: {
            organizationId: unitData.organizationId,
            OR: [
              { name: { equals: unitData.name, mode: 'insensitive' } },
              { symbol: { equals: unitData.symbol, mode: 'insensitive' } },
            ],
          },
        });

        if (!existingUnit) {
          await client.unitOfMeasure.create({
            data: {
              name: unitData.name,
              symbol: unitData.symbol,
              unitType: unitData.unitType,
              organizationId: unitData.organizationId,
            },
          });
          console.log(`Created base unit: ${unitData.name} (${unitData.symbol}) for organization ${organizationId}`);
        } else {
          console.log(
            `Base unit: ${unitData.name} or symbol ${unitData.symbol} already exists for organization ${organizationId}. Skipping.`
          );
        }
      }

      // Create derived units
      for (const unitData of derivedUnits) {
        // Find the base unit
        const baseUnit = await client.unitOfMeasure.findFirst({
          where: {
            organizationId: unitData.organizationId,
            name: { equals: unitData.baseUnitName, mode: 'insensitive' },
          },
        });

        if (!baseUnit) {
          console.warn(`Base unit ${unitData.baseUnitName} not found for derived unit ${unitData.name}. Skipping.`);
          continue;
        }

        const existingUnit = await client.unitOfMeasure.findFirst({
          where: {
            organizationId: unitData.organizationId,
            OR: [
              { name: { equals: unitData.name, mode: 'insensitive' } },
              { symbol: { equals: unitData.symbol, mode: 'insensitive' } },
            ],
          },
        });

        if (!existingUnit) {
          await client.unitOfMeasure.create({
            data: {
              name: unitData.name,
              symbol: unitData.symbol,
              unitType: unitData.unitType,
              organizationId: unitData.organizationId,
              baseUnitId: baseUnit.id,
              conversionFactor: unitData.conversionFactor,
            },
          });
          console.log(
            `Created derived unit: ${unitData.name} (${unitData.symbol}) based on ${unitData.baseUnitName} for organization ${organizationId}`
          );
        } else {
          console.log(
            `Derived unit: ${unitData.name} or symbol ${unitData.symbol} already exists for organization ${organizationId}. Skipping.`
          );
        }
      }
    };

    // Execute with transaction client if provided, otherwise use a new transaction
    if (tx) {
      await seedUnits(tx);
    } else {
      await prismaClient.$transaction(seedUnits);
    }

    console.log(`Successfully seeded units for organization ${organizationId}`);
  } catch (error: any) {
    console.error(`Failed to seed units for organization ${organizationId}:`, error);
    throw new Error(`Failed to seed units: ${error.message}`);
  } finally {
    // Only disconnect if no transaction client was provided
    if (!tx) {
      await prismaClient.$disconnect();
    }
  }
}

// --- Example Usage (Illustrative) ---
//eslint-disable-next-line
async function main() {
  // --- Setup Units (run once or as needed) ---
  // const orgId = "your_organization_id"; // Replace with actual org ID
  // // 1. Create base unit "Piece"
  // const pieceUnit = await createUnitOfMeasure({
  //   name: "Piece",
  //   symbol: "pc",
  //   organizationId: orgId,
  //   unitType: UnitType.COUNT,
  // });
  // console.log("Created Piece Unit:", pieceUnit);
  // // 2. Create derived unit "Dozen" (1 Dozen = 12 Pieces)
  // const dozenUnit = await createUnitOfMeasure({
  //   name: "Dozen",
  //   symbol: "dz",
  //   organizationId: orgId,
  //   unitType: UnitType.COUNT,
  //   baseUnitId: pieceUnit.id,
  //   conversionFactor: 12,
  // });
  // console.log("Created Dozen Unit:", dozenUnit);
  // // 3. Create derived unit "Case of 24" (1 Case = 24 Pieces)
  // const case24Unit = await createUnitOfMeasure({
  //   name: "Case (24 Pieces)",
  //   symbol: "case24",
  //   organizationId: orgId,
  //   unitType: UnitType.COUNT,
  //   baseUnitId: pieceUnit.id, // Based on Piece
  //   conversionFactor: 24,
  // });
  // console.log("Created Case (24 Pieces) Unit:", case24Unit);
  // // --- Configure a Product Variant (run once per variant) ---
  // const productVariantIdToConfigure = "your_product_variant_id"; // Replace
  // if (productVariantIdToConfigure !== "your_product_variant_id") {
  //    await configureProductVariantUnits({
  //      productVariantId: productVariantIdToConfigure,
  //      baseUnitId: pieceUnit.id,         // Inventory tracked in Pieces
  //      stockingUnitId: case24Unit.id,    // Typically bought in Cases of 24
  //      sellingUnitId: pieceUnit.id,      // Typically sold in Pieces
  //    });
  //    console.log(`Configured units for product variant ${productVariantIdToConfigure}`);
  // }
  // --- Perform Bulk Restock ---
  // const productVariant1Id = "variant_id_1"; // Replace with actual ID
  // const productVariant2Id = "variant_id_2"; // Replace with actual ID
  // const locationIdForRestock = "location_id_1"; // Replace
  // const memberIdPerformingRestock = "member_id_1"; // Replace
  // const currentOrgId = "your_organization_id"; // Replace
  // const caseUnitIdFromDb = "id_of_case24_unit"; // Replace with actual ID of "Case (24 Pieces)"
  // const dozenUnitIdFromDb = "id_of_dozen_unit"; // Replace with actual ID of "Dozen"
  // if (productVariant1Id !== "variant_id_1" && caseUnitIdFromDb !== "id_of_case24_unit") { // Ensure these are replaced
  //   const restockPayload: BulkRestockInput = {
  //     items: [
  //       {
  //         productVariantId: productVariant1Id,
  //         quantityInRestockUnit: 5,              // 5 Cases
  //         restockUnitId: caseUnitIdFromDb,       // Unit is "Case (24 Pieces)"
  //         purchasePricePerRestockUnit: 48,     // e.g., $48 per Case
  //         batchNumber: "BATCH001",
  //         expiryDate: new Date("2026-12-31"),
  //       },
  //       {
  //         productVariantId: productVariant2Id,
  //         quantityInRestockUnit: 10,             // 10 Dozens
  //         restockUnitId: dozenUnitIdFromDb,      // Unit is "Dozen"
  //         purchasePricePerRestockUnit: 10,     // e.g., $10 per Dozen
  //         batchNumber: "BATCH002",
  //       },
  //     ],
  //     locationId: locationIdForRestock,
  //     memberId: memberIdPerformingRestock,
  //     organizationId: currentOrgId,
  //     notes: "Regular weekly restocking via PO#789",
  //     movementType: MovementType.PURCHASE_RECEIPT,
  //   };
  //   try {
  //     const result = await bulkRestockProducts(restockPayload);
  //     console.log("Restock Result:", result);
  //   } catch (error) {
  //     console.error("Restock Failed:", error);
  //   }
  // }
}
