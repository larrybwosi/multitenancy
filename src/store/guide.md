# Warehouse & Inventory Location Management Implementation Guide

## Overview of Changes

I've enhanced your schema to support comprehensive warehouse and inventory space management with:

1. **Enhanced Location Types** - Distinguish between retail shops, warehouses, and other location types
2. **Hierarchical Locations** - Support parent-child relationships between locations
3. **Space Management** - Track capacity and usage across locations, zones, units, and positions
4. **Storage Organization** - Add support for zones, storage units (shelves/racks), and positions
5. **Product Dimensions** - Track physical dimensions to calculate space requirements
6. **Default Locations** - Designate default locations for new inventory

## Implementation Steps

### 1. Setting Up Location Types

Start by creating your primary location types:

```typescript
// Create a default retail shop location
await prisma.inventoryLocation.create({
  data: {
    name: "Main Store",
    description: "Primary retail store location",
    locationType: "RETAIL_SHOP",
    isDefault: true,
    isActive: true,
    capacityTracking: false,
    organizationId: orgId
  }
});

// Create a primary warehouse
await prisma.inventoryLocation.create({
  data: {
    name: "Main Warehouse",
    description: "Primary storage warehouse",
    locationType: "WAREHOUSE",
    address: "123 Warehouse Ave",
    totalCapacity: 5000,
    capacityUnit: "CUBIC_METER",
    capacityTracking: true,
    isActive: true,
    organizationId: orgId
  }
});
```

### 2. Creating Storage Zones

Divide larger warehouses into manageable zones:

```typescript
// Create zones within a warehouse
await prisma.storageZone.create({
  data: {
    name: "Zone A - Electronics",
    description: "Electronics and small items storage",
    locationId: warehouseId,
    capacity: 1200,
    capacityUnit: "CUBIC_METER",
    organizationId: orgId
  }
});
```

### 3. Setting Up Storage Units

Create storage units like shelves, racks, or bins:

```typescript
// Create a storage rack in Zone A
await prisma.storageUnit.create({
  data: {
    name: "Rack A1",
    reference: "RA1-2023",
    unitType: "RACK",
    locationId: warehouseId,
    zoneId: zoneAId,
    width: 2.4,
    height: 3.0,
    depth: 1.2,
    dimensionUnit: "m",
    maxWeight: 2000,
    weightUnit: "kg",
    capacity: 8.64, // 2.4 x 3.0 x 1.2
    capacityUnit: "CUBIC_METER",
    position: "Aisle 1, Row A",
    organizationId: orgId
  }
});

// Create a simple shelf in the retail store
await prisma.storageUnit.create({
  data: {
    name: "Display Shelf 1",
    unitType: "SHELF",
    locationId: storeId, // retail store location
    width: 180,
    height: 120,
    depth: 60,
    dimensionUnit: "cm",
    capacity: 1.296, // converted to cubic meters
    capacityUnit: "CUBIC_METER",
    position: "Front Wall",
    organizationId: orgId
  }
});
```

### 4. Adding Storage Positions

For detailed tracking, create positions within storage units:

```typescript
// Create positions on a rack
for (let level = 1; level <= 3; level++) {
  for (let section = 1; section <= 4; section++) {
    await prisma.storagePosition.create({
      data: {
        identifier: `A1-L${level}-S${section}`,
        storageUnitId: rackA1Id,
        width: 0.6, // 1/4 of rack width
        height: 1.0, // 1/3 of rack height
        depth: 1.2, // full rack depth
        dimensionUnit: "m",
        maxWeight: 500, // kg
        weightUnit: "kg",
        organizationId: orgId
      }
    });
  }
}
```

### 5. Updating Product Data

Add physical dimensions to your products:

```typescript
await prisma.product.update({
  where: { id: productId },
  data: {
    width: 25,
    height: 15,
    depth: 10,
    dimensionUnit: "cm",
    weight: 1.2,
    weightUnit: "kg",
    volumetricWeight: 0.00375, // 0.25 x 0.15 x 0.1 (in m³)
    defaultLocationId: storeId // Default location for this product
  }
});
```

### 6. Managing Stock with Location Data

When receiving stock, assign it to specific locations and storage positions:

```typescript
// Receive stock into a specific warehouse position
const stockBatch = await prisma.stockBatch.create({
  data: {
    productId,
    variantId,
    batchNumber: "BT123456",
    purchaseItemId: purchaseItem.id,
    locationId: warehouseId,
    storageUnitId: rackA1Id,
    positionId: positionA1L1S1Id,
    initialQuantity: 50,
    currentQuantity: 50,
    purchasePrice: 9.99,
    expiryDate: new Date('2025-12-31'),
    spaceOccupied: 0.1875, // 50 x 0.00375 (volumetric weight per unit)
    spaceUnit: "CUBIC_METER",
    organizationId: orgId
  }
});

// Update the storage position
await prisma.storagePosition.update({
  where: { id: positionA1L1S1Id },
  data: {
    isOccupied: true
  }
});

// Update the storage unit capacity used
await prisma.storageUnit.update({
  where: { id: rackA1Id },
  data: {
    capacityUsed: { increment: 0.1875 }
  }
});

// Update the zone capacity used
await prisma.storageZone.update({
  where: { id: zoneAId },
  data: {
    capacityUsed: { increment: 0.1875 }
  }
});

// Update the location capacity used
await prisma.inventoryLocation.update({
  where: { id: warehouseId },
  data: {
    capacityUsed: { increment: 0.1875 }
  }
});
```

### 7. Moving Stock Between Locations

Handle stock movements with updates to storage data:

```typescript
// Create a stock movement transaction
const stockMovement = await prisma.stockMovement.create({
  data: {
    productId,
    variantId,
    stockBatchId: stockBatch.id,
    quantity: 20,
    fromLocationId: warehouseId,
    toLocationId: storeId,
    movementType: "TRANSFER",
    memberId: currentUserId,
    notes: "Moving stock to retail store for display",
    organizationId: orgId
  }
});

// Update source and destination capacity usage
// This would be part of a transaction that also updates the batch quantities
```

## Space Management Functionality

### Capacity Enforcement

When `capacityTracking` and `enforceSpatialConstraints` are enabled in settings, you should implement checks before allowing new stock to be placed:

```typescript
// Check if a position has available space
function canPlaceStockInPosition(
  position, 
  product, 
  quantity
) {
  // Calculate required space
  const requiredSpace = (product.volumetricWeight || 0) * quantity;
  
  // Check position capacity
  const positionSpace = position.width * position.height * position.depth;
  const availableSpace = positionSpace - (position.isOccupied ? 0 : positionSpace);
  
  // Check weight constraints
  const requiredWeight = (product.weight || 0) * quantity;
  
  return {
    hasSpace: availableSpace >= requiredSpace,
    hasWeightCapacity: position.maxWeight >= requiredWeight,
    availableSpace,
    requiredSpace
  };
}
```

### Auto-Assign Stock Location

Create a function to automatically find the best location for incoming stock:

```typescript
async function findOptimalStockLocation(
  organizationId,
  productId,
  quantity
) {
  // 1. Check product's default location first
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { defaultLocation: true }
  });
  
  // 2. If no default or default is full, find locations by type
  const locations = await prisma.inventoryLocation.findMany({
    where: { 
      organizationId,
      isActive: true,
      capacityTracking: true,
      OR: [
        { locationType: "WAREHOUSE" },
        { locationType: "RETAIL_SHOP" }
      ]
    },
    orderBy: { locationType: 'asc' } // Warehouses first
  });
  
  // 3. For each location, find available positions
  // ... logic to find best position based on product dimensions
  
  return { locationId, unitId, positionId };
}
```

## Reporting & Visualization

Your system should now be able to generate rich warehouse management reports:

1. **Warehouse Capacity Reports** - Track overall space utilization
2. **Storage Unit Heat Maps** - Visualize which areas are full/empty
3. **Product Location Reports** - Where is a specific product stored?
4. **Optimization Suggestions** - Flag inefficiently used space

## API Endpoints to Implement

1. `GET /inventory-locations` - List all locations with type filters
2. `GET /inventory-locations/:id/space-usage` - Get space usage metrics
3. `GET /inventory-locations/:id/storage-units` - List storage units
4. `POST /storage-units/:id/positions` - Create positions in a unit
5. `GET /products/:id/locations` - Find where a product is stored
6. `POST /stock-batches/:id/move` - Move stock to new position

## Frontend UI Considerations

Consider the following UI elements for your warehouse management:

1. Interactive warehouse map showing zones and units
2. Color-coded capacity indicators
3. Drag-and-drop interface for stock movement
4. Barcode scanning integration for physical inventory
5. Mobile-friendly views for warehouse staff

## Default Location Setup Example

```typescript
// Set organization defaults
await prisma.organization.update({
  where: { id: orgId },
  data: {
    defaultLocationId: storeId,      // Default retail location
    defaultWarehouseId: warehouseId  // Default warehouse
  }
});

// Update organization settings
await prisma.organizationSettings.update({
  where: { organizationId: orgId },
  data: {
    enableCapacityTracking: true,
    enforceSpatialConstraints: true,
    enableProductDimensions: true,
    defaultMeasurementUnit: "CUBIC_METER",
    defaultDimensionUnit: "cm",
    defaultWeightUnit: "kg"
  }
});
```

This implementation guide provides a solid foundation for warehouse and inventory location management in your system. Adapt it to your specific needs and business processes.