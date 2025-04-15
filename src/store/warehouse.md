// Example implementation for warehouse management features
import { PrismaClient, MeasurementUnit, LocationType, StorageUnitType } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Initial Setup: Create default locations and storage organization
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