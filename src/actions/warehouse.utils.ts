/**
 * Warehouse Management Implementation Guide
 */

async function setupWarehouseSystem(organizationId: string) {
  // Create the default retail store location
  const store = await prisma.inventoryLocation.create({
    data: {
      name: "Main Retail Store",
      description: "Primary point-of-sale location",
      locationType: LocationType.RETAIL_SHOP,
      isDefault: true,
      isActive: true,
      capacityTracking: true,
      totalCapacity: 200,
      capacityUnit: MeasurementUnit.SQUARE_METER,
      organizationId,
    }
  });

  // Create the warehouse location
  const warehouse = await prisma.inventoryLocation.create({
    data: {
      name: "Main Warehouse",
      description: "Primary inventory storage facility",
      locationType: LocationType.WAREHOUSE,
      isActive: true,
      capacityTracking: true,
      totalCapacity: 5000,
      capacityUnit: MeasurementUnit.CUBIC_METER,
      // Create storage zones within the warehouse
      const receivingZone = await prisma.storageZone.create({
        data: {
          name: "Receiving Zone",
          description: "Area for processing incoming shipments",
          locationId: warehouse.id,
          capacity: 500,
          capacityUnit: MeasurementUnit.CUBIC_METER,
          isActive: true,
          organizationId,
        }
      });

      const pickingZone = await prisma.storageZone.create({
        data: {
          name: "Picking Zone",
          description: "Fast-moving items for quick order fulfillment",
          locationId: warehouse.id,
          capacity: 1000,
          capacityUnit: MeasurementUnit.CUBIC_METER,
          isActive: true,
          organizationId,
        }
      });

      // Create storage units within zones
      const palletRack1 = await prisma.storageUnit.create({
        data: {
          name: "Pallet Rack A1",
          unitType: StorageUnitType.RACK,
          locationId: warehouse.id,
          zoneId: pickingZone.id,
          width: 2.5,
          height: 3,
          depth: 1.2,
          dimensionUnit: "meters",
          maxWeight: 1000,
          weightUnit: "kg",
          capacity: 30,
          capacityUnit: MeasurementUnit.CUBIC_METER,
          isActive: true,
          organizationId,
        }
      });

      const shelfUnitB2 = await prisma.storageUnit.create({
        data: {
          name: "Shelf Unit B2",
          unitType: StorageUnitType.SHELF,
          locationId: warehouse.id,
          zoneId: pickingZone.id,
          width: 1.8,
          height: 2,
          depth: 0.6,
          dimensionUnit: "meters",
          maxWeight: 200,
          weightUnit: "kg",
          capacity: 2.16, // 1.8 * 2 * 0.6
          capacityUnit: MeasurementUnit.CUBIC_METER,
          isActive: true,
          organizationId,
        }
      });

      // Create storage positions within units
      await prisma.storagePosition.createMany({
        data: [
          {
            identifier: "A1-1",
            storageUnitId: palletRack1.id,
            width: 1.2,
            height: 1,
            depth: 1,
            dimensionUnit: "meters",
            maxWeight: 500,
            weightUnit: "kg",
            isOccupied: false,
            organizationId,
          },
          {
            identifier: "A1-2",
            storageUnitId: palletRack1.id,
            width: 1.2,
            height: 1,
            depth: 1,
            dimensionUnit: "meters",
            maxWeight: 500,
            weightUnit: "kg",
            isOccupied: false,
            organizationId,
          },
          {
            identifier: "B2-1",
            storageUnitId: shelfUnitB2.id,
            width: 0.6,
            height: 0.4,
            depth: 0.5,
            dimensionUnit: "meters",
            maxWeight: 50,
            weightUnit: "kg",
            isOccupied: false,
            organizationId,
          }
        ]
      });

      return {
        store,
        warehouse,
        zones: { receivingZone, pickingZone },
        units: { palletRack1, shelfUnitB2 }
      };
    }

    /**
     * Product Storage Management
     */
    async function assignProductStorage(productId: string, locationId: string, positionId?: string) {
      // Get product dimensions
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { width: true, height: true, depth: true, dimensionUnit: true }
      });

      if (!product) throw new Error("Product not found");

      // Find suitable storage position if not specified
      let storagePosition;
      if (!positionId) {
        storagePosition = await prisma.storagePosition.findFirst({
          where: {
            storageUnit: {
              locationId,
              isActive: true
            },
            isOccupied: false,
            width: { gte: product.width || 0 },
            height: { gte: product.height || 0 },
            depth: { gte: product.depth || 0 }
          },
          orderBy: { createdAt: 'asc' } // FIFO assignment
        });

        if (!storagePosition) {
          throw new Error("No available storage position found matching product dimensions");
        }
      } else {
        storagePosition = await prisma.storagePosition.findUnique({
          where: { id: positionId }
        });
      }

      // Update product's default location
      await prisma.product.update({
        where: { id: productId },
        data: {
          defaultLocationId: locationId
        }
      });

      return storagePosition;
    }

    /**
     * Inventory Receiving Process
     */
    async function receiveInventory(
      purchaseItemId: string,
      quantity: number,
      locationId: string,
      positionId?: string,
      batchNumber?: string,
      expiryDate?: Date
    ) {
      // Get purchase item details
      const purchaseItem = await prisma.purchaseItem.findUnique({
        where: { id: purchaseItemId },
        include: { product: true, variant: true }
      });

      if (!purchaseItem) throw new Error("Purchase item not found");

      // Assign storage if needed
      let position;
      if (purchaseItem.product.defaultLocationId !== locationId) {
        position = await assignProductStorage(
          purchaseItem.productId,
          locationId,
          positionId
        );
      }

      // Create stock batch
      const stockBatch = await prisma.stockBatch.create({
        data: {
          productId: purchaseItem.productId,
          variantId: purchaseItem.variantId,
          purchaseItemId: purchaseItem.id,
          locationId,
          storageUnitId: position?.storageUnitId || null,
          positionId: position?.id || null,
          initialQuantity: quantity,
          currentQuantity: quantity,
          purchasePrice: purchaseItem.unitCost,
          batchNumber,
          expiryDate,
          spaceOccupied: calculateSpaceOccupied(purchaseItem.product, quantity),
          spaceUnit: purchaseItem.product.dimensionUnit as MeasurementUnit | null,
          organizationId: purchaseItem.product.organizationId
        }
      });

      // Update product variant stock
      await updateVariantStock(
        purchaseItem.productId,
        purchaseItem.variantId,
        locationId,
        quantity
      );

      // Create stock movement record
      await prisma.stockMovement.create({
        data: {
          productId: purchaseItem.productId,
          variantId: purchaseItem.variantId,
          stockBatchId: stockBatch.id,
          quantity,
          toLocationId: locationId,
          movementType: 'PURCHASE_RECEIPT',
          referenceId: purchaseItem.purchaseId,
          referenceType: 'Purchase',
          memberId: 'current-member-id', // Replace with actual member ID
          organizationId: purchaseItem.product.organizationId
        }
      });

      return stockBatch;
    }

    function calculateSpaceOccupied(product: { width?: number | null, height?: number | null, depth?: number | null }, quantity: number): number | null {
      if (!product.width || !product.height || !product.depth) return null;
      return product.width * product.height * product.depth * quantity;
    }

    async function updateVariantStock(productId: string, variantId: string | null, locationId: string, quantityChange: number) {
      if (!variantId) return;

      const existingStock = await prisma.productVariantStock.findUnique({
        where: {
          variantId_locationId: {
            variantId,
            locationId
          }
        }
      });

      if (existingStock) {
        await prisma.productVariantStock.update({
          where: { id: existingStock.id },
          data: {
            currentStock: { increment: quantityChange },
            availableStock: { increment: quantityChange },
            lastUpdated: new Date()
          }
        });
      } else {
        await prisma.productVariantStock.create({
          data: {
            productId,
            variantId,
            locationId,
            currentStock: quantityChange,
            availableStock: quantityChange,
            organizationId: 'organization-id' // Replace with actual org ID
          }
        });
      }
    }

    /**
     * Stock Transfer Between Locations
     */
    async function transferStock(
      stockBatchId: string,
      quantity: number,
      fromLocationId: string,
      toLocationId: string,
      memberId: string,
      notes?: string
    ) {
      // Verify stock availability
      const stockBatch = await prisma.stockBatch.findUnique({
        where: { id: stockBatchId }
      });

      if (!stockBatch) throw new Error("Stock batch not found");
      if (stockBatch.currentQuantity < quantity) {
        throw new Error("Insufficient stock available for transfer");
      }

      // Create movement record
      const movement = await prisma.stockMovement.create({
        data: {
          productId: stockBatch.productId,
          variantId: stockBatch.variantId,
          stockBatchId: stockBatch.id,
          quantity,
          fromLocationId,
          toLocationId,
          movementType: 'TRANSFER',
          memberId,
          notes,
          organizationId: stockBatch.organizationId
        }
      });

      // Update source batch quantity
      await prisma.stockBatch.update({
        where: { id: stockBatchId },
        data: {
          currentQuantity: { decrement: quantity }
        }
      });

      // Find or create destination batch
      let destinationBatch = await prisma.stockBatch.findFirst({
        where: {
          productId: stockBatch.productId,
          variantId: stockBatch.variantId,
          locationId: toLocationId,
          batchNumber: stockBatch.batchNumber
        }
      });

      if (destinationBatch) {
        await prisma.stockBatch.update({
          where: { id: destinationBatch.id },
          data: {
            currentQuantity: { increment: quantity }
          }
        });
      } else {
        destinationBatch = await prisma.stockBatch.create({
          data: {
            productId: stockBatch.productId,
            variantId: stockBatch.variantId,
            locationId: toLocationId,
            batchNumber: stockBatch.batchNumber,
            initialQuantity: quantity,
            currentQuantity: quantity,
            purchasePrice: stockBatch.purchasePrice,
            expiryDate: stockBatch.expiryDate,
            organizationId: stockBatch.organizationId
          }
        });
      }

      // Update variant stock levels
      if (stockBatch.variantId) {
        await updateVariantStock(
          stockBatch.productId,
          stockBatch.variantId,
          fromLocationId,
          -quantity
        );
        await updateVariantStock(
          stockBatch.productId,
          stockBatch.variantId,
          toLocationId,
          quantity
        );
      }

      return {
        movement,
        sourceBatch: stockBatch,
        destinationBatch
      };
    }

    /**
     * Stock Level Monitoring
     */
    async function checkStockLevels(organizationId: string) {
      // Get low stock items
      const lowStockItems = await prisma.productVariantStock.findMany({
        where: {
          organizationId,
          currentStock: {
            lte: prisma.productVariantStock.fields.reorderPoint
          }
        },
        include: {
          variant: true,
          location: true,
          product: true
        }
      });

      // Get items approaching expiry
      const expiringSoon = await prisma.stockBatch.findMany({
        where: {
          organizationId,
          expiryDate: {
            lte: new Date(new Date().setDate(new Date().getDate() + 30)), // Next 30 days
            gte: new Date()
          },
          currentQuantity: { gt: 0 }
        },
        include: {
          product: true,
          variant: true,
          location: true
        },
        orderBy: { expiryDate: 'asc' }
      });

      return {
        lowStockItems,
        expiringSoon
      };
    }

    /**
     * Space Utilization Reports
     */
    async function getSpaceUtilization(locationId: string) {
      const location = await prisma.inventoryLocation.findUnique({
        where: { id: locationId },
        include: {
          storageZones: {
            include: {
              storageUnits: {
                include: {
                  positions: {
                    include: {
                      stockBatches: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!location) throw new Error("Location not found");

      // Calculate total used space
      let totalUsed = 0;
      const zoneReports = location.storageZones.map(zone => {
        let zoneUsed = 0;
        const unitReports = zone.storageUnits.map(unit => {
          let unitUsed = 0;
          const positionReports = unit.positions.map(position => {
            const positionUsed = position.stockBatches.reduce((sum, batch) => {
              return sum + (batch.spaceOccupied || 0);
            }, 0);
            unitUsed += positionUsed;
            return {
              positionId: position.id,
              identifier: position.identifier,
              capacity: position.width && position.height && position.depth 
                ? position.width * position.height * position.depth 
                : null,
              used: positionUsed,
              utilization: position.width && position.height && position.depth
                ? (positionUsed / (position.width * position.height * position.depth)) * 100
                : null
            };
          });
          zoneUsed += unitUsed;
          return {
            unitId: unit.id,
            name: unit.name,
            capacity: unit.capacity,
            used: unitUsed,
            utilization: unit.capacity ? (unitUsed / unit.capacity) * 100 : null,
            positions: positionReports
          };
        });
        totalUsed += zoneUsed;
        return {
          zoneId: zone.id,
          name: zone.name,
          capacity: zone.capacity,
          used: zoneUsed,
          utilization: zone.capacity ? (zoneUsed / zone.capacity) * 100 : null,
          units: unitReports
        };
      });

      const locationUtilization = location.totalCapacity 
        ? (totalUsed / location.totalCapacity) * 100 
        : null;

      return {
        locationId: location.id,
        name: location.name,
        totalCapacity: location.totalCapacity,
        totalUsed,
        utilization: locationUtilization,
        zones: zoneReports
      };
    }

    // Export the warehouse management functions
    export const warehouseService = {
      setupWarehouseSystem,
      assignProductStorage,
      receiveInventory,
      transferStock,
      checkStockLevels,
      getSpaceUtilization
    };