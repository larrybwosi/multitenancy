import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Package,
  Tag,
  Settings,
  Edit,
  CheckCircle2,
  XCircle,
  BarChart4,
  Clock,
  Box,
  Users,
  Star,
  ChevronRight,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

// TypeScript interfaces
interface StockBatch {
  id: string;
  variantId: string;
  batchNumber: string;
  initialQuantity: number;
  currentQuantity: number;
  purchasePrice: number;
  receivedDate: Date;
  variant: any;
}

interface VariantStock {
  id: string;
  productId: string;
  variantId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  reorderQty: number;
  product: any;
  variant: any;
}

interface StockItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  value: number;
}

interface BranchProps {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  locationType: string;
  address: string | null;
  totalCapacity: number | null;
  capacityUnit: string | null;
  capacityUsed: number;
  capacityTracking: boolean;
  parentLocationId: string | null;
  customFields: any | null;
  createdAt: Date;
  updatedAt: Date;
  managerId: string | null;
  organizationId: string;
  manager: any | null;
  zones: any[];
  storageUnits: any[];
  stockBatches: StockBatch[];
  variantStocks: VariantStock[];
  used: number;
  productCount: number;
  stockValue: number;
  stockItems: StockItem[];
}

// Component for stats card
const StatCard = ({ icon: Icon, title, value, subtext, className = '' }) => (
  <div className="bg-white rounded-xl shadow-md p-4 flex flex-col">
    <div className="flex items-center mb-2">
      <div className={`p-2 rounded-lg mr-3 ${className}`}>
        <Icon size={20} className="text-white" />
      </div>
      <span className="text-gray-500 text-sm font-medium">{title}</span>
    </div>
    <div className="mt-2">
      <div className="text-2xl font-bold">{value}</div>
      {subtext && <div className="text-gray-500 text-xs mt-1">{subtext}</div>}
    </div>
  </div>
);

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format date
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

// Branch Details Component
const BranchDetails: React.FC<{ branch: BranchProps }> = ({ branch }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBranch, setEditedBranch] = useState({ ...branch });
  const [activeTab, setActiveTab] = useState('overview');

  // Mutation for updating branch
  const updateBranchMutation = useMutation({
    mutationFn: async (updatedData: Partial<BranchProps>) => {
      // Find changed fields only
      const changedFields: Partial<BranchProps> = {};
      for (const key in updatedData) {
        if (JSON.stringify(updatedData[key]) !== JSON.stringify(branch[key])) {
          changedFields[key] = updatedData[key];
        }
      }

      if (Object.keys(changedFields).length === 0) {
        return branch; // No changes
      }

      // API call to update only changed fields
      const response = await fetch(`/api/branch/${branch.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changedFields),
      });

      if (!response.ok) {
        throw new Error('Failed to update branch');
      }

      return await response.json();
    },
    onSuccess: data => {
      setIsEditing(false);
      // You would typically update your local state or invalidate queries here
    },
  });

  const handleChange = (field: string, value: any) => {
    setEditedBranch(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    updateBranchMutation.mutate(editedBranch);
  };

  const capacityPercentage = branch.totalCapacity
    ? Math.min(100, Math.round((branch.capacityUsed / branch.totalCapacity) * 100))
    : 0;

  const capacityColor =
    capacityPercentage > 90 ? 'bg-red-500' : capacityPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-64 relative">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-3xl font-bold">{isEditing ? editedBranch.name : branch.name}</h1>
              <div className="flex items-center mt-2">
                <Building2 className="text-indigo-200 mr-2" size={16} />
                <span className="text-indigo-100">{branch.locationType.replace('_', ' ').toLowerCase()}</span>
                {branch.isDefault && (
                  <div className="ml-3 bg-indigo-700 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <Star size={12} className="mr-1" />
                    Default Location
                  </div>
                )}
                <div
                  className={`ml-3 ${branch.isActive ? 'bg-green-500' : 'bg-red-500'} text-white text-xs px-2 py-1 rounded-full flex items-center`}
                >
                  {branch.isActive ? (
                    <>
                      <CheckCircle2 size={12} className="mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle size={12} className="mr-1" />
                      Inactive
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg flex items-center hover:bg-opacity-30 transition mr-2"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </button>
                  <button className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg flex items-center hover:bg-opacity-30 transition">
                    <Settings size={16} className="mr-2" />
                    Settings
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSubmit}
                    disabled={updateBranchMutation.isPending}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-600 transition mr-2"
                  >
                    <Save size={16} className="mr-2" />
                    {updateBranchMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedBranch({ ...branch });
                    }}
                    className="bg-white text-gray-700 px-4 py-2 rounded-lg flex items-center hover:bg-gray-100 transition"
                  >
                    <XCircle size={16} className="mr-2" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="absolute bottom-0 w-full px-6">
          <div className="flex space-x-6 text-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 font-medium transition-colors ${activeTab === 'overview' ? 'text-white border-b-2 border-white' : 'text-indigo-200 hover:text-white'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-1 font-medium transition-colors ${activeTab === 'inventory' ? 'text-white border-b-2 border-white' : 'text-indigo-200 hover:text-white'}`}
            >
              Inventory ({branch.stockItems.length})
            </button>
            <button
              onClick={() => setActiveTab('batches')}
              className={`py-4 px-1 font-medium transition-colors ${activeTab === 'batches' ? 'text-white border-b-2 border-white' : 'text-indigo-200 hover:text-white'}`}
            >
              Stock Batches ({branch.stockBatches.length})
            </button>
            <button
              onClick={() => setActiveTab('zones')}
              className={`py-4 px-1 font-medium transition-colors ${activeTab === 'zones' ? 'text-white border-b-2 border-white' : 'text-indigo-200 hover:text-white'}`}
            >
              Zones & Units
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-6 py-8 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 - Details Card */}
          <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-1">
            <h2 className="text-lg font-bold mb-4">Branch Details</h2>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={editedBranch.name}
                    onChange={e => handleChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editedBranch.description}
                    onChange={e => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={editedBranch.address || ''}
                    onChange={e => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editedBranch.isActive ? 'active' : 'inactive'}
                      onChange={e => handleChange('isActive', e.target.value === 'active')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Location</label>
                    <select
                      value={editedBranch.isDefault ? 'yes' : 'no'}
                      onChange={e => handleChange('isDefault', e.target.value === 'yes')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Capacity</label>
                    <input
                      type="number"
                      value={editedBranch.totalCapacity || ''}
                      onChange={e => handleChange('totalCapacity', e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity Unit</label>
                    <select
                      value={editedBranch.capacityUnit || ''}
                      onChange={e => handleChange('capacityUnit', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">None</option>
                      <option value="METER">Meter</option>
                      <option value="SQUARE_METER">Square Meter</option>
                      <option value="CUBIC_METER">Cubic Meter</option>
                      <option value="ITEM">Item</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editedBranch.capacityTracking}
                      onChange={e => handleChange('capacityTracking', e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable Capacity Tracking</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Description</div>
                  <div className="mt-1">{branch.description}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500">Address</div>
                  <div className="mt-1 flex items-center">
                    <MapPin size={16} className="text-gray-400 mr-1" />
                    {branch.address || 'No address specified'}
                  </div>
                </div>

                {branch.capacityTracking && branch.totalCapacity && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Capacity Usage</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${capacityColor}`}
                        style={{ width: `${capacityPercentage}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-sm flex justify-between">
                      <span>
                        {branch.capacityUsed} / {branch.totalCapacity} {branch.capacityUnit?.toLowerCase()}
                      </span>
                      <span>{capacityPercentage}% used</span>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <div className="text-sm text-gray-500">Organization</div>
                  <div className="mt-1">{branch.organizationId.replace('org-', '')}</div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="text-sm text-gray-500">Created</div>
                    <div className="mt-1 text-sm">{formatDate(branch.createdAt)}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Last Updated</div>
                    <div className="mt-1 text-sm">{formatDate(branch.updatedAt)}</div>
                  </div>
                </div>

                {branch.manager && (
                  <div className="pt-2">
                    <div className="text-sm text-gray-500">Manager</div>
                    <div className="mt-1 flex items-center">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                        <Users size={16} className="text-indigo-600" />
                      </div>
                      {branch.manager.name || 'Unknown Manager'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 2-3 - Content based on active tab */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard
                    icon={Package}
                    title="Total Products"
                    value={branch.productCount}
                    subtext="Unique product variants"
                    className="bg-blue-500"
                  />

                  <StatCard
                    icon={Tag}
                    title="Stock Value"
                    value={formatCurrency(branch.stockValue)}
                    subtext="Based on purchase prices"
                    className="bg-green-500"
                  />

                  <StatCard
                    icon={Box}
                    title="Stock Quantity"
                    value={branch.used}
                    subtext="Total items in inventory"
                    className="bg-purple-500"
                  />
                </div>

                {/* Top Products Card */}
                <div className="bg-white rounded-xl shadow-md">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold">Inventory Items</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Product
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Quantity
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Value
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {branch.stockItems.length > 0 ? (
                          branch.stockItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{item.productName}</div>
                                <div className="text-sm text-gray-500">ID: {item.productId.substring(0, 8)}...</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-900">{item.quantity}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-gray-900">{formatCurrency(item.value)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button className="text-indigo-600 hover:text-indigo-900">View Details</button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                              No stock items available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {branch.stockItems.length > 5 && (
                    <div className="px-6 py-3 flex justify-center border-t border-gray-200">
                      <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium flex items-center">
                        View All Inventory
                        <ChevronRight size={16} className="ml-1" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'inventory' && (
              <div className="bg-white rounded-xl shadow-md">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold">Inventory Management</h3>
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Add Product</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Product
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Current Stock
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Reserved
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Available
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Reorder Point
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {branch.variantStocks.map(stock => {
                        const needsReorder = stock.currentStock <= stock.reorderPoint;

                        return (
                          <tr key={stock.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {stock.product?.name || 'Unknown Product'}
                              </div>
                              <div className="text-sm text-gray-500">SKU: {stock.variant?.sku || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900">{stock.currentStock}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900">{stock.reservedStock}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900">{stock.availableStock}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {needsReorder ? (
                                <div className="flex items-center text-red-600">
                                  <AlertTriangle size={16} className="mr-1" />
                                  {stock.reorderPoint} (Low Stock)
                                </div>
                              ) : (
                                <div className="text-gray-900">{stock.reorderPoint}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button className="text-indigo-600 hover:text-indigo-900 mr-3">Adjust</button>
                              <button className="text-indigo-600 hover:text-indigo-900">Transfer</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'batches' && (
              <div className="bg-white rounded-xl shadow-md">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold">Stock Batches</h3>
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Add New Batch</button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Batch Number
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Product
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Initial Qty
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Current Qty
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Purchase Price
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Received Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {branch.stockBatches.map(batch => (
                        <tr key={batch.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{batch.batchNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{batch.variant?.name || 'Unknown Product'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{batch.initialQuantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{batch.currentQuantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{formatCurrency(batch.purchasePrice)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{formatDate(batch.receivedDate)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'zones' && (
              <div className="bg-white rounded-xl shadow-md">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold">Zones & Storage Units</h3>
                  <div>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm mr-2">Add Zone</button>
                    <button className="bg-white border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg text-sm">
                      Add Storage Unit
                    </button>
                  </div>
                </div>

                {branch.zones.length === 0 && branch.storageUnits.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="mx-auto w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <MapPin size={32} className="text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Zones or Storage Units</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Create zones and storage units to better organize your inventory and track items within this
                      location.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">
                        Create First Zone
                      </button>
                      <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">
                        Learn More
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    {/* If we had zones or storage units, we would show them here */}
                    <div className="text-gray-500 italic text-center">
                      No zones or storage units have been created yet.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDetails;
