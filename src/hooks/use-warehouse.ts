import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { InventoryLocation, StorageZone, StorageUnit, MovementType } from '@/prisma/client';
import { CreateInventoryLocation } from '@/lib/validations/warehouse';

// Type definitions
// Extended interfaces for better type safety
interface WarehouseWithDetails extends InventoryLocation {
  manager?: {
    id: string;
    name?: string;
  };
  zones?: StorageZone[];
  storageUnits?: (StorageUnit & {
    capacityUsed: number;
    productCount: number;
  })[];
  stockValue?: number;
  stockItems?: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    value: number;
    location?: {
      unitId: string;
      unitName: string;
      position: string;
    } | null;
  }[];
  productCount?: number;
}


interface Warehouse {
  id: string;
  name: string;
  isActive: boolean;
}

interface WarehouseResponse {
  warehouses: Warehouse[];
}


const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export const useLocations = (enabled = true) => {
  return useQuery<WarehouseResponse>({
    queryKey: ['warehouse'],
    queryFn: () => fetcher<WarehouseResponse>('/api/warehouse'),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
    enabled,
  });
};


export const useGetWarehouse = (id: string) => {
  return useQuery<WarehouseWithDetails>({
    queryKey: ['warehouse', id],
    queryFn: async (): Promise<WarehouseWithDetails> => {
      const response = await fetch(`/api/warehouse/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch warehouse details');
      }
      const warehouse = await response.json();

      return warehouse;
    },
    refetchOnWindowFocus: false,
  });
};


export const useCreateWarehouse = () => {
  return useMutation({
    mutationFn: async (warehouseData: CreateInventoryLocation) => {
      const response = await fetch('/api/warehouse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(warehouseData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create warehouse');
      }

      return response.json();
    },
    onError:(e)=>{
      console.log(e)
      toast.error('Error', {
        description: 'Failed to create warehouse. Please try again.',
      });
    }
  });
};
export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => fetch(`/api/warehouse/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Success', {
        description: 'Warehouse deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      router.push('/warehouses');
    },
    onError: (error: Error) => {
      toast.error('Error', {
        description: error.message || 'Failed to delete warehouse',
      });
    },
  });
};

export const useUpdateWarehouse = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: Partial<WarehouseWithDetails>) =>
      fetch(`/api/warehouse/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }).then(res => res.json()),
    onSuccess: updatedData => {
      queryClient.setQueryData(['warehouse', id], (oldData: { warehouse: WarehouseWithDetails }) => ({
        warehouse: { ...oldData.warehouse, ...updatedData.warehouse },
      }));
      toast.success('Success', {
        description: 'Warehouse updated successfully',
      });
    },
    onError: (error: Error) => {
      toast.error('Error', {
        description: error.message || 'Failed to update warehouse',
      });
    },
  });
};

export const useGetWarehouseTransactions = (warehouseId: string, filters: TransactionFilters) => {
  return useQuery({
    queryKey: ['warehouse-transactions', warehouseId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      // Add all filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else if (value !== undefined) {
          params.append(key, String(value));
        }
      });

      const response = await fetch(`/api/warehouse/${warehouseId}/transactions?${params.toString()}`);
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
  });
};


interface TransactionFilters {
  movementType?: MovementType[]
  productId?: string
  variantId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  memberId?: string
  page?: number
  pageSize?: number
}

