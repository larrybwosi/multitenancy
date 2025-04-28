'use client';
import { WarehouseDetailsPage } from '@/components/organization/warehouse/warehouse-details-page';
import { useAppStore } from '@/store/app';
import { useRouter } from 'next/navigation';
import { Warehouse, Package, Building2, ArrowRight } from 'lucide-react';

export default function CurrentWarehouse() {
  const currentWarehouse = useAppStore(state => state.currentWarehouse);
  const router = useRouter();
  const id = currentWarehouse?.id;
  console.log('Current Warehouse ID:', id);

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-dashed border-gray-300 bg-gray-50 mx-auto my-12 max-w-2xl text-center">
        <div className="bg-white p-4 rounded-full mb-4 shadow-sm">
          <Building2 className="h-12 w-12 text-blue-500" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Current Warehouse Selected</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          You haven&apos;t selected a warehouse yet. Warehouses help you organize your inventory and manage your
          products efficiently.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mb-6">
          <div className="flex items-start p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <Warehouse className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-medium text-gray-800">Multiple Locations</h3>
              <p className="text-sm text-gray-600">Manage inventory across different locations</p>
            </div>
          </div>

          <div className="flex items-start p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <Package className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" />
            <div className="text-left">
              <h3 className="font-medium text-gray-800">Track Inventory</h3>
              <p className="text-sm text-gray-600">Monitor stock levels and movements</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push('/warehouses?modal=true')}
          className="flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Create Warehouse
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    );
  }

  return <WarehouseDetailsPage id={id} />;
}
