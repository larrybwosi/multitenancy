import BranchDetails from "@/components/organization/warehouse/warehouse-id";

export default function WarehouseDetailsPage() {
  const branch = {
    id: 'cma5if0jb0002bk7s3v5sfa23',
    name: 'Main Store',
    description: 'Primary retail store location',
    isActive: true,
    isDefault: true,
    locationType: 'RETAIL_SHOP',
    address: null,
    totalCapacity: null,
    capacityUnit: null,
    capacityUsed: 0,
    capacityTracking: false,
    parentLocationId: null,
    customFields: null,
    createdAt: '2025-05-01T15:18:17.971Z',
    updatedAt: '2025-05-01T15:18:17.971Z',
    managerId: null,
    organizationId: 'org-dealio-inc',
    manager: null,
    zones: [],
    storageUnits: [],
    stockBatches: [
      {
        id: 'cma772k0i0001bk7k9frb3t4n',
        variantId: 'cma6vx3gg0002bkmsslxx99tg',
        batchNumber: 'BATCH-cma-cma-250502-GRZB',
        purchaseItemId: null,
        locationId: 'cma5if0jb0002bk7s3v5sfa23',
        storageUnitId: null,
        positionId: null,
        initialQuantity: 160,
        currentQuantity: 160,
        purchasePrice: 180,
        expiryDate: null,
        receivedDate: '2025-05-02T19:34:35.149Z',
        createdAt: '2025-05-02T19:36:13.262Z',
        updatedAt: '2025-05-02T19:36:13.262Z',
        spaceOccupied: null,
        spaceUnit: 'METER',
        organizationId: 'org-dealio-inc',
        supplierId: null,
        landedCost: null,
        batchSalePrice: null,
        variant: [Object],
        storageUnit: null,
        position: null
      }
    ],
    variantStocks: [
      {
        id: 'cma772kc90003bk7kumfnggnf',
        productId: 'cma6vx3gf0001bkmsdcrjjg8r',
        variantId: 'cma6vx3gg0002bkmsslxx99tg',
        locationId: 'cma5if0jb0002bk7s3v5sfa23',
        currentStock: 160,
        reservedStock: 0,
        availableStock: 160,
        reorderPoint: 5,
        reorderQty: 10,
        lastUpdated: '2025-05-02T19:36:13.688Z',
        organizationId: 'org-dealio-inc',
        product: [Object],
        variant: [Object]
      }
    ],
    used: 160,
    productCount: 1,
    stockValue: 28800,
    stockItems: [
      {
        id: 'cma772k0i0001bk7k9frb3t4n',
        productId: 'cma6vx3gf0001bkmsdcrjjg8r',
        productName: 'Huawei',
        quantity: 160,
        value: 28800,
        location: null
      }
    ]
  }
  return (
    <BranchDetails branch={branch}/>
  );
}