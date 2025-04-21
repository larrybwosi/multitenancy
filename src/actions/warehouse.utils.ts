import prisma from "@/lib/db";
import { MeasurementUnit, StorageUnitType } from "@prisma/client";

async function assignProductStorageDefaults(
  productId: string,
  variantId: string,
  orgId: string
) {
  // Get the organization's default warehouse
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { defaultWarehouseId: true },
  });

  if (!org || !org.defaultWarehouseId) {
    throw new Error("Organization has no default warehouse configured");
  }

  // Get the product to check if it has dimensions
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { width: true, height: true, length: true, dimensionUnit: true },
  });

  // Determine optimal storage based on product characteristics
  let zoneId: string | undefined;
  let unitType: StorageUnitType | undefined;

  if (product?.width && product.height && product.length) {
    // Large or bulky items go to bulk storage
    const volume = product.width * product.height * product.length;
    if (volume > 10) {
      // Example threshold
      const bulkZone = await prisma.storageZone.findFirst({
        where: {
          locationId: org.defaultWarehouseId,
          name: { contains: "Bulk" },
        },
      });
      if (bulkZone) zoneId = bulkZone.id;
      unitType = "PALLET";
    } else {
      // Small items go to fast-moving zone
      const fastZone = await prisma.storageZone.findFirst({
        where: {
          locationId: org.defaultWarehouseId,
          name: { contains: "Fast" },
        },
      });
      if (fastZone) zoneId = fastZone.id;
      unitType = "SHELF";
    }
  }

  // Create stock record for the variant in the default location
  await prisma.productVariantStock.create({
    data: {
      product: { connect: { id: productId } },
      variant: { connect: { id: variantId } },
      location: { connect: { id: org.defaultWarehouseId } },
      currentStock: 0,
      organization: { connect: { id: orgId } },
    },
  });

  // Optionally update product with default location
  await prisma.product.update({
    where: { id: productId },
    data: {
      defaultLocation: { connect: { id: org.defaultWarehouseId } },
    },
  });

  return {
    warehouseId: org.defaultWarehouseId,
    zoneId,
    recommendedUnitType: unitType,
  };
}

async function findOptimalStoragePosition(
  productId: string,
  variantId: string,
  quantity: number,
  orgId: string
) {
  // Get product dimensions
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      width: true,
      height: true,
      length: true,
      dimensionUnit: true,
      weight: true,
      weightUnit: true,
    },
  });

  if (!product) throw new Error("Product not found");

  // Calculate space needed
  const spaceNeeded =
    (product.width || 1) *
    (product.height || 1) *
    (product.length || 1) *
    quantity;

  // Get organization's default warehouse
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { defaultWarehouseId: true },
  });

  if (!org?.defaultWarehouseId)
    throw new Error("No default warehouse configured");

  // Find suitable positions
  const suitablePositions = await prisma.storagePosition.findMany({
    where: {
      storageUnit: {
        locationId: org.defaultWarehouseId,
        // Filter by unit type based on product size
        unitType: spaceNeeded > 10 ? "PALLET" : "SHELF",
      },
      isOccupied: false,
      // Ensure position can handle the weight
      ...(product.weight
        ? {
            maxWeight: { gte: product.weight * quantity },
            weightUnit: product.weightUnit || "lbs",
          }
        : {}),
    },
    include: {
      storageUnit: {
        include: {
          zone: true,
        },
      },
    },
    orderBy: {
      // Prefer positions in fast-moving zones for high-turnover items
      storageUnit: {
        zone: {
          name: "desc", // Assuming fast-moving zones come first alphabetically
        },
      },
    },
  });

  if (suitablePositions.length === 0) {
    throw new Error("No available storage positions matching requirements");
  }

  return suitablePositions[0];
}

async function receiveInventory(
  purchaseItemId: string,
  quantity: number,
  positionId: string,
  memberId: string,
  orgId: string
) {
  // Get purchase item details
  const purchaseItem = await prisma.purchaseItem.findUnique({
    where: { id: purchaseItemId },
    include: {
      product: true,
      variant: true,
      purchase: true,
    },
  });

  if (!purchaseItem) throw new Error("Purchase item not found");

  // Get storage position
  const position = await prisma.storagePosition.findUnique({
    where: { id: positionId },
    include: {
      storageUnit: {
        include: {
          location: true,
        },
      },
    },
  });

  if (!position) throw new Error("Storage position not found");
  if (position.isOccupied)
    throw new Error("Storage position is already occupied");

  // Create stock batch
  const batch = await prisma.stockBatch.create({
    data: {
      product: { connect: { id: purchaseItem.productId } },
      variant: purchaseItem.variantId
        ? { connect: { id: purchaseItem.variantId } }
        : undefined,
      purchaseItem: { connect: { id: purchaseItemId } },
      location: { connect: { id: position.storageUnit.location.id } },
      position: { connect: { id: positionId } },
      storageUnit: { connect: { id: position.storageUnit.id } },
      initialQuantity: quantity,
      currentQuantity: quantity,
      purchasePrice: purchaseItem.unitCost,
      receivedDate: new Date(),
      organization: { connect: { id: orgId } },
      // Calculate space occupied if product has dimensions
      spaceOccupied:
        purchaseItem.product.width &&
        purchaseItem.product.height &&
        purchaseItem.product.length
          ? purchaseItem.product.width *
            purchaseItem.product.height *
            purchaseItem.product.length *
            quantity
          : undefined,
      spaceUnit:
        (purchaseItem.product.dimensionUnit as MeasurementUnit) || undefined,
    },
  });

  // Mark position as occupied
  await prisma.storagePosition.update({
    where: { id: positionId },
    data: { isOccupied: true },
  });

  // Update variant stock levels
  await updateVariantStock(
    purchaseItem.productId,
    purchaseItem.variantId || undefined,
    position.storageUnit.location.id,
    quantity,
    orgId
  );

  // Create stock movement record
  await prisma.stockMovement.create({
    data: {
      product: { connect: { id: purchaseItem.productId } },
      variant: purchaseItem.variantId
        ? { connect: { id: purchaseItem.variantId } }
        : undefined,
      stockBatch: { connect: { id: batch.id } },
      quantity: quantity,
      toLocation: { connect: { id: position.storageUnit.location.id } },
      movementType: "PURCHASE_RECEIPT",
      referenceId: purchaseItem.purchaseId,
      referenceType: "Purchase",
      member: { connect: { id: memberId } },
      organization: { connect: { id: orgId } },
    },
  });

  return batch;
}

async function updateVariantStock(
  productId: string,
  variantId: string | undefined,
  locationId: string,
  quantity: number,
  orgId: string
) {
  if (!variantId) return; // Only track stock for variants

  // Find or create stock record
  const existingStock = await prisma.productVariantStock.findUnique({
    where: {
      variantId_locationId: {
        variantId,
        locationId,
      },
    },
  });

  if (existingStock) {
    // Update existing stock
    await prisma.productVariantStock.update({
      where: {
        variantId_locationId: {
          variantId,
          locationId,
        },
      },
      data: {
        currentStock: { increment: quantity },
        availableStock: { increment: quantity },
        lastUpdated: new Date(),
      },
    });
  } else {
    // Create new stock record
    await prisma.productVariantStock.create({
      data: {
        product: { connect: { id: productId } },
        variant: { connect: { id: variantId } },
        location: { connect: { id: locationId } },
        currentStock: quantity,
        availableStock: quantity,
        organization: { connect: { id: orgId } },
      },
    });
  }
}

async function moveInventory(
  stockBatchId: string,
  newPositionId: string,
  quantity: number,
  memberId: string,
  orgId: string
) {
  // Get the stock batch
  const batch = await prisma.stockBatch.findUnique({
    where: { id: stockBatchId },
    include: {
      product: true,
      variant: true,
      position: true,
      location: true,
    },
  });

  if (!batch) throw new Error("Stock batch not found");
  if (batch.currentQuantity < quantity)
    throw new Error("Insufficient stock available");

  // Get the new position
  const newPosition = await prisma.storagePosition.findUnique({
    where: { id: newPositionId },
    include: {
      storageUnit: {
        include: {
          location: true,
        },
      },
    },
  });

  if (!newPosition) throw new Error("New storage position not found");
  if (newPosition.isOccupied)
    throw new Error("New storage position is already occupied");

  // Check if moving to same location (just changing position)
  const isSameLocation =
    newPosition.storageUnit.location.id === batch.locationId;

  // Create movement record
  await prisma.stockMovement.create({
    data: {
      product: { connect: { id: batch.productId } },
      variant: batch.variantId
        ? { connect: { id: batch.variantId } }
        : undefined,
      stockBatch: { connect: { id: batch.id } },
      quantity: quantity,
      fromLocation: isSameLocation
        ? undefined
        : { connect: { id: batch.locationId } },
      toLocation: isSameLocation
        ? undefined
        : { connect: { id: newPosition.storageUnit.location.id } },
      movementType: "TRANSFER",
      member: { connect: { id: memberId } },
      organization: { connect: { id: orgId } },
    },
  });

  // Update positions
  if (batch.positionId) {
    // Free up old position if all stock is moved
    const remainingInOldPosition = batch.currentQuantity - quantity;
    if (remainingInOldPosition <= 0) {
      await prisma.storagePosition.update({
        where: { id: batch.positionId },
        data: { isOccupied: false },
      });
    }
  }

  // Mark new position as occupied
  await prisma.storagePosition.update({
    where: { id: newPositionId },
    data: { isOccupied: true },
  });

  // If moving to a different location, create a new batch there
  if (!isSameLocation) {
    // Create new batch at destination
    const newBatch = await prisma.stockBatch.create({
      data: {
        product: { connect: { id: batch.productId } },
        variant: batch.variantId
          ? { connect: { id: batch.variantId } }
          : undefined,
        batchNumber: batch.batchNumber,
        location: { connect: { id: newPosition.storageUnit.location.id } },
        position: { connect: { id: newPositionId } },
        storageUnit: { connect: { id: newPosition.storageUnit.id } },
        initialQuantity: quantity,
        currentQuantity: quantity,
        purchasePrice: batch.purchasePrice,
        expiryDate: batch.expiryDate,
        receivedDate: new Date(),
        spaceOccupied: batch.spaceOccupied
          ? (batch.spaceOccupied / batch.initialQuantity) * quantity
          : undefined,
        spaceUnit: batch.spaceUnit,
        organization: { connect: { id: orgId } },
      },
    });

    // Update variant stock levels
    if (batch.variantId) {
      await updateVariantStock(
        batch.productId,
        batch.variantId,
        batch.locationId,
        -quantity,
        orgId
      );
      await updateVariantStock(
        batch.productId,
        batch.variantId,
        newPosition.storageUnit.location.id,
        quantity,
        orgId
      );
    }

    // Reduce quantity in original batch
    await prisma.stockBatch.update({
      where: { id: batch.id },
      data: { currentQuantity: { decrement: quantity } },
    });

    return newBatch;
  } else {
    // Just update position within same location
    await prisma.stockBatch.update({
      where: { id: batch.id },
      data: {
        position: { connect: { id: newPositionId } },
        storageUnit: { connect: { id: newPosition.storageUnit.id } },
      },
    });

    return batch;
  }
}

async function getWarehouseCapacity(warehouseId: string) {
  const warehouse = await prisma.inventoryLocation.findUnique({
    where: { id: warehouseId },
    select: {
      id: true,
      name: true,
      totalCapacity: true,
      capacityUnit: true,
      capacityUsed: true,
      _count: {
        select: {
          stockBatches: true,
          storageUnits: true,
        },
      },
    },
  });

  if (!warehouse) throw new Error("Warehouse not found");

  // Get capacity by zone
  const zones = await prisma.storageZone.findMany({
    where: { locationId: warehouseId },
    select: {
      id: true,
      name: true,
      capacity: true,
      capacityUsed: true,
      _count: {
        select: {
          storageUnits: true,
        },
      },
    },
  });

  // Get capacity by product category
  const categories = await prisma.category.findMany({
    where: { organizationId: warehouseId }, // Assuming organizationId is stored in warehouseId (adjust as needed)
    select: {
      id: true,
      name: true,
      products: {
        select: {
          _count: {
            select: {
              stockBatches: {
                where: { locationId: warehouseId },
              },
            },
          },
        },
      },
    },
  });

  // Calculate space used by category
  const categoryUsage = categories.map((category) => ({
    categoryId: category.id,
    categoryName: category.name,
    productCount: category.products.length,
    batchCount: category.products.reduce(
      (sum, product) => sum + product._count.stockBatches,
      0
    ),
  }));

  return {
    warehouse,
    zones,
    categoryUsage,
    utilizationPercentage: warehouse.totalCapacity
      ? ((warehouse.capacityUsed || 0) / warehouse.totalCapacity) * 100
      : null,
  };
}


async function calculateStorageUtilization(locationId: string) {
  const location = await prisma.inventoryLocation.findUnique({
    where: { id: locationId },
    select: {
      id: true,
      name: true,
      totalCapacity: true,
      capacityUnit: true,
      capacityUsed: true,
    },
  });

  if (!location) throw new Error("Location not found");

  // Get all storage units in this location
  const storageUnits = await prisma.storageUnit.findMany({
    where: { locationId },
    select: {
      id: true,
      name: true,
      capacity: true,
      capacityUsed: true,
      capacityUnit: true,
      unitType: true,
      _count: {
        select: {
          positions: {
            where: { isOccupied: true },
          },
        },
      },
    },
  });

  // Calculate utilization at unit level
  const unitsWithUtilization = storageUnits.map((unit) => ({
    ...unit,
    utilizationPercentage: unit.capacity
      ? ((unit.capacityUsed || 0) / unit.capacity) * 100
      : null,
    occupiedPositions: unit._count.positions,
  }));

  // Calculate overall location utilization
  const totalCapacity =
    location.totalCapacity ||
    storageUnits.reduce((sum, unit) => sum + (unit.capacity || 0), 0);

  const totalUsed =
    location.capacityUsed ||
    storageUnits.reduce((sum, unit) => sum + (unit.capacityUsed || 0), 0);

  return {
    location,
    totalCapacity,
    totalUsed,
    utilizationPercentage: totalCapacity
      ? (totalUsed / totalCapacity) * 100
      : null,
    storageUnits: unitsWithUtilization,
  };
}

async function findProductInWarehouse(
  productId: string,
  variantId: string,
  warehouseId: string
) {
  // Check if variant exists in this warehouse
  const variantStock = await prisma.productVariantStock.findUnique({
    where: {
      variantId_locationId: {
        variantId,
        locationId: warehouseId,
      },
    },
    include: {
      location: true,
    },
  });

  if (!variantStock || variantStock.currentStock <= 0) {
    return null; // Not in stock at this location
  }

  // Find all batches of this variant in the warehouse
  const batches = await prisma.stockBatch.findMany({
    where: {
      productId,
      variantId,
      locationId: warehouseId,
      currentQuantity: { gt: 0 },
    },
    include: {
      position: {
        include: {
          storageUnit: {
            include: {
              zone: true,
            },
          },
        },
      },
    },
    orderBy: [
      // FEFO (First Expired, First Out) sorting
      { expiryDate: "asc" },
      // Fallback to FIFO (First In, First Out)
      { receivedDate: "asc" },
    ],
  });

  if (batches.length === 0) {
    return null; // No available batches despite stock record
  }

  return {
    variantStock,
    batches,
    totalAvailable: batches.reduce(
      (sum, batch) => sum + batch.currentQuantity,
      0
    ),
  };
}

async function getStockLevelReport(orgId: string, locationId?: string) {
  // Get all locations if none specified
  const locations = locationId
    ? [{ id: locationId }]
    : await prisma.inventoryLocation.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      });

  // Get stock for each location
  const stockReports = await Promise.all(
    locations.map(async ({ id }) => {
      const location = await prisma.inventoryLocation.findUnique({
        where: { id },
        select: { name: true, locationType: true },
      });

      const variantStocks = await prisma.productVariantStock.findMany({
        where: { locationId: id, organizationId: orgId },
        include: {
          variant: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                  reorderPoint: true,
                  defaultLocationId: true,
                },
              },
            },
          },
        },
        orderBy: {
          variant: {
            product: {
              name: "asc",
            },
          },
        },
      });

      // Calculate which items are below reorder point
      const lowStockItems = variantStocks.filter(
        (stock) =>
          stock.currentStock <=
          (stock.reorderPoint || stock.variant.product.reorderPoint || 5)
      );

      // Group by storage zone
      const stockByZone = await prisma.stockBatch.groupBy({
        by: ["storageUnitId"],
        where: {
          locationId: id,
          organizationId: orgId,
          currentQuantity: { gt: 0 },
        },
        _sum: {
          currentQuantity: true,
          spaceOccupied: true,
        },
        _count: {
          id: true,
        },
      });

      return {
        locationId: id,
        locationName: location?.name,
        locationType: location?.locationType,
        totalItems: variantStocks.length,
        totalStock: variantStocks.reduce(
          (sum, stock) => sum + stock.currentStock,
          0
        ),
        lowStockItems: lowStockItems.length,
        stockByZone: stockByZone.map((zone) => ({
          storageUnitId: zone.storageUnitId,
          totalItems: zone._count.id,
          totalQuantity: zone._sum.currentQuantity,
          spaceUsed: zone._sum.spaceOccupied,
        })),
        variants: variantStocks.map((stock) => ({
          variantId: stock.variantId,
          productName: stock.variant.product.name,
          sku: stock.variant.sku,
          currentStock: stock.currentStock,
          reorderPoint:
            stock.reorderPoint || stock.variant.product.reorderPoint || 5,
          isLowStock:
            stock.currentStock <=
            (stock.reorderPoint || stock.variant.product.reorderPoint || 5),
          isDefaultLocation: stock.variant.product.defaultLocationId === id,
        })),
      };
    })
  );

  return stockReports;
}
export {
  assignProductStorageDefaults,
  findProductInWarehouse,
  calculateStorageUtilization,
  getWarehouseCapacity,
  findOptimalStoragePosition,
  moveInventory,
  getStockLevelReport,
  receiveInventory,
};
