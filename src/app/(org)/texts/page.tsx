'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  BarChart3, 
  Box, 
  Search, 
  Layers, 
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertTriangle,
  Check
} from 'lucide-react';

// Type definitions based on the provided functions
type StoragePosition = {
  id: string;
  name?: string;
  isOccupied: boolean;
  storageUnit: StorageUnit;
};

type StorageUnit = {
  id: string;
  name: string;
  capacity: number;
  capacityUsed: number;
  capacityUnit: string;
  unitType: string;
  location: InventoryLocation;
  zone?: StorageZone;
};

type StorageZone = {
  id: string;
  name: string;
  capacity: number;
  capacityUsed: number;
};

type InventoryLocation = {
  id: string;
  name: string;
  totalCapacity: number;
  capacityUnit: string;
  capacityUsed: number;
};

type Product = {
  id: string;
  name: string;
  sku: string;
};

type ProductVariant = {
  id: string;
  name: string;
  sku: string;
  productId: string;
};

type StockBatch = {
  id: string;
  productId: string;
  variantId?: string;
  batchNumber: string;
  locationId: string;
  positionId?: string;
  initialQuantity: number;
  currentQuantity: number;
  purchasePrice: number;
  expiryDate?: Date;
  receivedDate: Date;
  spaceOccupied?: number;
  spaceUnit?: string;
  product: Product;
  variant?: ProductVariant;
  position?: StoragePosition;
  location: InventoryLocation;
};

type WarehouseCapacity = {
  warehouse: {
    id: string;
    name: string;
    totalCapacity: number;
    capacityUnit: string;
    capacityUsed: number;
    _count: {
      stockBatches: number;
      storageUnits: number;
    };
  };
  zones: StorageZone[];
  categoryUsage: {
    categoryId: string;
    categoryName: string;
    productCount: number;
    batchCount: number;
  }[];
  utilizationPercentage: number | null;
};

type StorageUtilization = {
  location: InventoryLocation;
  totalCapacity: number;
  totalUsed: number;
  utilizationPercentage: number | null;
  storageUnits: (StorageUnit & {
    utilizationPercentage: number | null;
    occupiedPositions: number;
  })[];
};

type ProductInWarehouse = {
  variantStock: {
    currentStock: number;
    location: InventoryLocation;
  };
  batches: StockBatch[];
  totalAvailable: number;
};

// Mock Functions to simulate API calls
const mockMoveInventory = async (
  stockBatchId: string,
  newPositionId: string,
  quantity: number,
  memberId: string,
  orgId: string
): Promise<StockBatch> => {
  // Simulate API call
  console.log('Moving inventory', { stockBatchId, newPositionId, quantity });
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {} as StockBatch;
};

const mockGetWarehouseCapacity = async (warehouseId: string): Promise<WarehouseCapacity> => {
  // Simulate API call
  console.log('Getting warehouse capacity', { warehouseId });
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data
  return {
    warehouse: {
      id: warehouseId,
      name: 'Main Warehouse',
      totalCapacity: 10000,
      capacityUnit: 'cubic feet',
      capacityUsed: 6500,
      _count: {
        stockBatches: 245,
        storageUnits: 50,
      },
    },
    zones: [
      { id: 'z1', name: 'Zone A', capacity: 3000, capacityUsed: 2200 },
      { id: 'z2', name: 'Zone B', capacity: 4000, capacityUsed: 3000 },
      { id: 'z3', name: 'Zone C', capacity: 3000, capacityUsed: 1300 },
    ],
    categoryUsage: [
      { categoryId: 'c1', categoryName: 'Electronics', productCount: 50, batchCount: 120 },
      { categoryId: 'c2', categoryName: 'Furniture', productCount: 35, batchCount: 80 },
      { categoryId: 'c3', categoryName: 'Apparel', productCount: 25, batchCount: 45 },
    ],
    utilizationPercentage: 65,
  };
};

const mockCalculateStorageUtilization = async (locationId: string): Promise<StorageUtilization> => {
  // Simulate API call
  console.log('Calculating storage utilization', { locationId });
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data
  return {
    location: {
      id: locationId,
      name: 'Main Warehouse',
      totalCapacity: 10000,
      capacityUnit: 'cubic feet',
      capacityUsed: 6500,
    },
    totalCapacity: 10000,
    totalUsed: 6500,
    utilizationPercentage: 65,
    storageUnits: [
      {
        id: 'su1',
        name: 'Rack A1',
        capacity: 500,
        capacityUsed: 350,
        capacityUnit: 'cubic feet',
        unitType: 'RACK',
        utilizationPercentage: 70,
        occupiedPositions: 12,
      },
      {
        id: 'su2',
        name: 'Rack A2',
        capacity: 500,
        capacityUsed: 450,
        capacityUnit: 'cubic feet',
        unitType: 'RACK',
        utilizationPercentage: 90,
        occupiedPositions: 15,
      },
      {
        id: 'su3',
        name: 'Shelf B1',
        capacity: 200,
        capacityUsed: 100,
        capacityUnit: 'cubic feet',
        unitType: 'SHELF',
        utilizationPercentage: 50,
        occupiedPositions: 5,
      },
    ],
  };
};

const mockFindProductInWarehouse = async (
  productId: string,
  variantId: string,
  warehouseId: string
): Promise<ProductInWarehouse | null> => {
  // Simulate API call
  console.log('Finding product in warehouse', { productId, variantId, warehouseId });
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data
  return {
    variantStock: {
      currentStock: 120,
      location: { 
        id: warehouseId, 
        name: 'Main Warehouse',
        totalCapacity: 10000,
        capacityUnit: 'cubic feet',
        capacityUsed: 6500,
      },
    },
    batches: [
      {
        id: 'batch1',
        productId,
        variantId,
        batchNumber: 'B2023-001',
        locationId: warehouseId,
        positionId: 'pos1',
        initialQuantity: 100,
        currentQuantity: 75,
        purchasePrice: 25.99,
        expiryDate: new Date('2025-12-31'),
        receivedDate: new Date('2023-01-15'),
        product: { id: productId, name: 'Premium Chair', sku: 'CHAIR-001' },
        variant: { id: variantId, name: 'Black', sku: 'CHAIR-001-BLK', productId },
        position: {
          id: 'pos1',
          name: 'A1-01',
          isOccupied: true,
          storageUnit: {
            id: 'su1',
            name: 'Rack A1',
            capacity: 500,
            capacityUsed: 350,
            capacityUnit: 'cubic feet',
            unitType: 'RACK',
            location: { 
              id: warehouseId, 
              name: 'Main Warehouse',
              totalCapacity: 10000,
              capacityUnit: 'cubic feet',
              capacityUsed: 6500,
            },
          },
        },
        location: { 
          id: warehouseId, 
          name: 'Main Warehouse',
          totalCapacity: 10000,
          capacityUnit: 'cubic feet',
          capacityUsed: 6500,
        },
      },
      {
        id: 'batch2',
        productId,
        variantId,
        batchNumber: 'B2023-005',
        locationId: warehouseId,
        positionId: 'pos2',
        initialQuantity: 50,
        currentQuantity: 45,
        purchasePrice: 25.99,
        expiryDate: new Date('2025-06-30'),
        receivedDate: new Date('2023-02-10'),
        product: { id: productId, name: 'Premium Chair', sku: 'CHAIR-001' },
        variant: { id: variantId, name: 'Black', sku: 'CHAIR-001-BLK', productId },
        position: {
          id: 'pos2',
          name: 'A1-02',
          isOccupied: true,
          storageUnit: {
            id: 'su1',
            name: 'Rack A1',
            capacity: 500,
            capacityUsed: 350,
            capacityUnit: 'cubic feet',
            unitType: 'RACK',
            location: { 
              id: warehouseId, 
              name: 'Main Warehouse',
              totalCapacity: 10000,
              capacityUnit: 'cubic feet',
              capacityUsed: 6500,
            },
          },
        },
        location: { 
          id: warehouseId, 
          name: 'Main Warehouse',
          totalCapacity: 10000,
          capacityUnit: 'cubic feet',
          capacityUsed: 6500,
        },
      },
    ],
    totalAvailable: 120,
  };
};

// Mock data for form fields
const mockWarehouses = [
  { id: 'w1', name: 'Main Warehouse' },
  { id: 'w2', name: 'Distribution Center' },
  { id: 'w3', name: 'Retail Storage' },
];

const mockProducts = [
  { id: 'p1', name: 'Premium Chair', sku: 'CHAIR-001' },
  { id: 'p2', name: 'Office Desk', sku: 'DESK-001' },
  { id: 'p3', name: 'Filing Cabinet', sku: 'CAB-001' },
];

const mockVariants = {
  'p1': [
    { id: 'v1', name: 'Black', sku: 'CHAIR-001-BLK', productId: 'p1' },
    { id: 'v2', name: 'White', sku: 'CHAIR-001-WHT', productId: 'p1' },
  ],
  'p2': [
    { id: 'v3', name: 'Oak', sku: 'DESK-001-OAK', productId: 'p2' },
    { id: 'v4', name: 'Maple', sku: 'DESK-001-MPL', productId: 'p2' },
  ],
  'p3': [
    { id: 'v5', name: '2-Drawer', sku: 'CAB-001-2DR', productId: 'p3' },
    { id: 'v6', name: '4-Drawer', sku: 'CAB-001-4DR', productId: 'p3' },
  ],
};

const mockPositions = [
  { id: 'pos1', name: 'A1-01', isOccupied: true, storageUnitId: 'su1' },
  { id: 'pos2', name: 'A1-02', isOccupied: true, storageUnitId: 'su1' },
  { id: 'pos3', name: 'A1-03', isOccupied: false, storageUnitId: 'su1' },
  { id: 'pos4', name: 'B2-01', isOccupied: false, storageUnitId: 'su2' },
  { id: 'pos5', name: 'B2-02', isOccupied: false, storageUnitId: 'su2' },
];

// Component for Warehouse Capacity View
const WarehouseCapacityView: React.FC<{ warehouseId: string }> = ({ warehouseId }) => {
  const [loading, setLoading] = useState(true);
  const [capacity, setCapacity] = useState<WarehouseCapacity | null>(null);

  useEffect(() => {
    const fetchCapacity = async () => {
      setLoading(true);
      try {
        const data = await mockGetWarehouseCapacity(warehouseId);
        setCapacity(data);
      } catch (error) {
        console.error('Error fetching warehouse capacity', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCapacity();
  }, [warehouseId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!capacity) {
    return <div className="text-center text-red-500">Failed to load warehouse capacity data</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Overall Utilization</h3>
          <div className="mt-2">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{capacity.utilizationPercentage?.toFixed(1)}%</span>
              <span className="text-sm text-gray-500">{capacity.warehouse.capacityUsed} / {capacity.warehouse.totalCapacity} {capacity.warehouse.capacityUnit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${capacity.utilizationPercentage || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            <div>Stock Batches: {capacity.warehouse._count.stockBatches}</div>
            <div>Storage Units: {capacity.warehouse._count.storageUnits}</div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Alerts</h3>
          <div className="mt-2 space-y-2">
            {capacity.utilizationPercentage && capacity.utilizationPercentage > 90 ? (
              <div className="flex items-center text-red-500">
                <AlertTriangle size={16} className="mr-1" />
                <span>Warehouse near capacity</span>
              </div>
            ) : (
              <div className="flex items-center text-green-500">
                <Check size={16} className="mr-1" />
                <span>Space available</span>
              </div>
            )}
            
            {capacity.zones.some(z => (z.capacityUsed / z.capacity) > 0.9) && (
              <div className="flex items-center text-amber-500">
                <AlertTriangle size={16} className="mr-1" />
                <span>Some zones near capacity</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Warehouse Information</h3>
          <div className="mt-2 text-sm">
            <div className="grid grid-cols-2 gap-1">
              <span className="text-gray-500">Name:</span>
              <span>{capacity.warehouse.name}</span>
              
              <span className="text-gray-500">Total Capacity:</span>
              <span>{capacity.warehouse.totalCapacity} {capacity.warehouse.capacityUnit}</span>
              
              <span className="text-gray-500">Space Used:</span>
              <span>{capacity.warehouse.capacityUsed} {capacity.warehouse.capacityUnit}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Zone Utilization</h3>
          <div className="mt-4 space-y-4">
            {capacity.zones.map(zone => (
              <div key={zone.id}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{zone.name}</span>
                  <span className="text-sm text-gray-500">
                    {((zone.capacityUsed / zone.capacity) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      (zone.capacityUsed / zone.capacity) > 0.9 ? 'bg-red-500' : 
                      (zone.capacityUsed / zone.capacity) > 0.7 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(zone.capacityUsed / zone.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Category Distribution</h3>
          <div className="mt-4 space-y-2">
            {capacity.categoryUsage.map(category => (
              <div key={category.categoryId} className="flex justify-between">
                <span className="text-sm">{category.categoryName}</span>
                <div className="text-sm space-x-4">
                  <span>{category.productCount} products</span>
                  <span>{category.batchCount} batches</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for Storage Utilization View
const StorageUtilizationView: React.FC<{ locationId: string }> = ({ locationId }) => {
  const [loading, setLoading] = useState(true);
  const [utilization, setUtilization] = useState<StorageUtilization | null>(null);

  useEffect(() => {
    const fetchUtilization = async () => {
      setLoading(true);
      try {
        const data = await mockCalculateStorageUtilization(locationId);
        setUtilization(data);
      } catch (error) {
        console.error('Error fetching storage utilization', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUtilization();
  }, [locationId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!utilization) {
    return <div className="text-center text-red-500">Failed to load storage utilization data</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-700">Overall Storage Utilization</h3>
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">{utilization.utilizationPercentage?.toFixed(1)}%</span>
            <span className="text-sm text-gray-500">
              {utilization.totalUsed} / {utilization.totalCapacity} {utilization.location.capacityUnit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${utilization.utilizationPercentage || 0}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-700">Storage Units</h3>
        <div className="mt-4 space-y-6">
          {utilization.storageUnits.map(unit => (
            <div key={unit.id} className="border-b pb-4 last:border-b-0 last:pb-0">
              <div className="flex justify-between mb-2">
                <div>
                  <h4 className="font-medium">{unit.name}</h4>
                  <p className="text-sm text-gray-500">{unit.unitType}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{unit.capacityUsed} / {unit.capacity} {unit.capacityUnit}</p>
                  <p className="text-sm text-gray-500">{unit.occupiedPositions} positions occupied</p>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    (unit.utilizationPercentage || 0) > 90 ? 'bg-red-500' : 
                    (unit.utilizationPercentage || 0) > 70 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${unit.utilizationPercentage || 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Component for Move Inventory Form
const MoveInventoryForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedPosition, setSelectedPosition] = useState('');
  
  const [productDetails, setProductDetails] = useState<ProductInWarehouse | null>(null);
  const [availableBatches, setAvailableBatches] = useState<StockBatch[]>([]);
  
  // Reset form
  const resetForm = () => {
    setSelectedWarehouse('');
    setSelectedProduct('');
    setSelectedVariant('');
    setSelectedBatch('');
    setQuantity(1);
    setSelectedPosition('');
    setProductDetails(null);
    setAvailableBatches([]);
    setSuccess(false);
    setError(null);
  };
  
  // Handle warehouse change
  const handleWarehouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWarehouse(e.target.value);
    setSelectedProduct('');
    setSelectedVariant('');
    setSelectedBatch('');
    setProductDetails(null);
    setAvailableBatches([]);
  };
  
  // Handle product selection
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProduct(e.target.value);
    setSelectedVariant('');
    setSelectedBatch('');
    setProductDetails(null);
    setAvailableBatches([]);
  };
  
  // Handle variant selection
  const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVariant(e.target.value);
    setSelectedBatch('');
    setProductDetails(null);
    setAvailableBatches([]);
  };
  
  // Find product in warehouse
  const handleFindProduct = async () => {
    if (!selectedProduct || !selectedVariant || !selectedWarehouse) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const details = await mockFindProductInWarehouse(
        selectedProduct,
        selectedVariant,
        selectedWarehouse
      );
      
      setProductDetails(details);
      if (details) {
        setAvailableBatches(details.batches);
      }
    } catch (err) {
      setError('Failed to find product in warehouse');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBatch || !selectedPosition || !quantity) {
      setError('Please fill out all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock user ID and org ID (in a real app, these would come from auth context)
      const memberId = 'user123';
      const orgId = 'org456';
      
      await mockMoveInventory(
        selectedBatch,
        selectedPosition,
        quantity,
        memberId,
        orgId
      );
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to move inventory');
    } finally {
      setLoading(false);
    }
  };
  
  // Reset form on success after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        resetForm();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Move Inventory</h2>
      
      {success && (
        <div className="mb-6 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Inventory moved successfully!
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Step 1: Select Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse
            </label>
            <select
              value={selectedWarehouse}
              onChange={handleWarehouseChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select a warehouse</option>
              {mockWarehouses.map(warehouse => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Step 2: Select Product and Variant */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <select
              value={selectedProduct}
              onChange={handleProductChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 mb-2"
              disabled={!selectedWarehouse}
              required
            >
              <option value="">Select a product</option>
              {mockProducts.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
            
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant
            </label>
            <select
              value={selectedVariant}
              onChange={handleVariantChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={!selectedProduct}
              required
            >
              <option value="">Select a variant</option>
              {selectedProduct && mockVariants[selectedProduct as keyof typeof mockVariants]?.map(variant => (
                <option key={variant.id} value={variant.id}>
                  {variant.name} ({variant.sku})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Find Product Button */}
        <div>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={handleFindProduct}
            disabled={!selectedWarehouse || !selectedProduct || !selectedVariant || loading}
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Finding...
              </>
            ) : (
              <>
                <Search className="-ml-1 mr-2 h-4 w-4" />
                Find Product
              </>
            )}
          </button>
        </div>
        
        {/* Product Details Section */}
        {productDetails && (
          <div className="border rounded-md p-4 bg-gray-50">
            <h3 className="font-medium mb-2">Product Information</h3>
            
            <div className="text-sm mb-4">
              <p><span className="font-medium">Product:</span> {productDetails.batches[0]?.product.name}</p>
              <p><span className="font-medium">Variant:</span> {productDetails.batches[0]?.variant?.name}</p>
              <p><span className="font-medium">Total Available:</span> {productDetails.totalAvailable}</p>
              <p><span className="font-medium">Location:</span> {productDetails.variantStock.location.name}</p>
            </div>
            
            <h4 className="font-medium mb-2">Available Batches</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {availableBatches.map(batch => (
                    <tr key={batch.id} className={selectedBatch === batch.id ? 'bg-blue-50' : ''}>
                      <td className="px-3 py-2 text-sm">{batch.batchNumber}</td>
                      <td className="px-3 py-2 text-sm">{batch.position?.name || 'N/A'}</td>
                      <td className="px-3 py-2 text-sm">{batch.currentQuantity}</td>
                      <td className="px-3 py-2 text-sm">
                        {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <button
                          type="button"
                          className={`text-sm ${selectedBatch === batch.id ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                          onClick={() => {
                            setSelectedBatch(batch.id);
                            setQuantity(Math.min(quantity, batch.currentQuantity));
                          }}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Step 3: Move Details */}
        {selectedBatch && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity to Move
              </label>
              <input
                type="number"
                min="1"
                max={availableBatches.find(b => b.id === selectedBatch)?.currentQuantity || 1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Position
              </label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select new position</option>
                {mockPositions
                  .filter(pos => !pos.isOccupied || pos.id === availableBatches.find(b => b.id === selectedBatch)?.positionId)
                  .map(position => (
                    <option key={position.id} value={position.id}>
                      {position.name} {position.isOccupied ? '(Current)' : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={!selectedBatch || !selectedPosition || !quantity || loading || success}
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRight className="-ml-1 mr-2 h-4 w-4" />
                Move Inventory
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Component for Product Search
const ProductSearch: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [searchWarehouse, setSearchWarehouse] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [searchVariant, setSearchVariant] = useState('');
  const [productLocation, setProductLocation] = useState<ProductInWarehouse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchWarehouse || !searchProduct || !searchVariant) {
      setError('Please select all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await mockFindProductInWarehouse(
        searchProduct,
        searchVariant,
        searchWarehouse
      );
      
      setProductLocation(result);
      if (!result) {
        setError('Product not found in the selected warehouse');
      }
    } catch (err) {
      setError('Failed to search for product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Find Product Location</h2>
      
      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Warehouse
          </label>
          <select
            value={searchWarehouse}
            onChange={(e) => setSearchWarehouse(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select a warehouse</option>
            {mockWarehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product
          </label>
          <select
            value={searchProduct}
            onChange={(e) => {
              setSearchProduct(e.target.value);
              setSearchVariant('');
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={!searchWarehouse}
          >
            <option value="">Select a product</option>
            {mockProducts.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Variant
          </label>
          <select
            value={searchVariant}
            onChange={(e) => setSearchVariant(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={!searchProduct}
          >
            <option value="">Select a variant</option>
            {searchProduct && mockVariants[searchProduct as keyof typeof mockVariants]?.map(variant => (
              <option key={variant.id} value={variant.id}>
                {variant.name} ({variant.sku})
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mb-6">
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={handleSearch}
          disabled={!searchWarehouse || !searchProduct || !searchVariant || loading}
        >
          {loading ? (
            <>
              <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
              Searching...
            </>
          ) : (
            <>
              <Search className="-ml-1 mr-2 h-4 w-4" />
              Find Product
            </>
          )}
        </button>
      </div>
      
      {productLocation && (
        <div className="border rounded-md p-4 bg-gray-50">
          <div className="mb-4">
            <h3 className="font-medium mb-2">Product Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <p><span className="font-medium">Product:</span> {productLocation.batches[0]?.product.name}</p>
                <p><span className="font-medium">Variant:</span> {productLocation.batches[0]?.variant?.name}</p>
              </div>
              <div>
                <p><span className="font-medium">SKU:</span> {productLocation.batches[0]?.variant?.sku || productLocation.batches[0]?.product.sku}</p>
                <p><span className="font-medium">Total Available:</span> {productLocation.totalAvailable}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Location Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage Unit</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productLocation.batches.map(batch => (
                    <tr key={batch.id}>
                      <td className="px-3 py-2 text-sm">{batch.batchNumber}</td>
                      <td className="px-3 py-2 text-sm">{batch.position?.storageUnit.name || 'N/A'}</td>
                      <td className="px-3 py-2 text-sm">{batch.position?.name || 'N/A'}</td>
                      <td className="px-3 py-2 text-sm">{batch.currentQuantity}</td>
                      <td className="px-3 py-2 text-sm">
                        {batch.expiryDate ? (
                          <div className="flex items-center">
                            {new Date(batch.expiryDate) < new Date() ? (
                              <AlertTriangle size={14} className="text-red-500 mr-1" />
                            ) : (
                              <Clock size={14} className="text-gray-500 mr-1" />
                            )}
                            {new Date(batch.expiryDate).toLocaleDateString()}
                          </div>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Warehouse Actions Page Component
const WarehouseActionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('capacity');
  const [selectedWarehouse, setSelectedWarehouse] = useState(mockWarehouses[0]?.id || '');
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Warehouse Management</h1>
          <p className="text-gray-500">Manage inventory, check capacity, and find products</p>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Warehouse
          </label>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="max-w-xs block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {mockWarehouses.map(warehouse => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('capacity')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'capacity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Capacity Overview
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('utilization')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'utilization'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Layers className="h-5 w-5 mr-2" />
                Storage Utilization
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('move')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'move'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ArrowRight className="h-5 w-5 mr-2" />
                Move Inventory
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('find')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'find'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Find Product
              </div>
            </button>
          </nav>
        </div>
        
        <div className="mt-6">
          {activeTab === 'capacity' && <WarehouseCapacityView warehouseId={selectedWarehouse} />}
          {activeTab === 'utilization' && <StorageUtilizationView locationId={selectedWarehouse} />}
          {activeTab === 'move' && <MoveInventoryForm />}
          {activeTab === 'find' && <ProductSearch />}
        </div>
      </div>
    </div>
  );
};

export default WarehouseActionsPage;