import { Supplier } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

interface Warehouse {
  id: string;
  name: string;
  isActive: boolean;
}


interface WarehouseResponse {
  warehouses: Warehouse[];
}

interface SupplierResponse {
  data: {
    suppliers: Supplier[];
    currentPage: number;
    totalCount: number;
    totalPages: number;
  };
  success: boolean;
}

const useLocations = () => {
  return useQuery<WarehouseResponse>({
    queryKey: ["warehouse"],
    queryFn: () => fetcher<WarehouseResponse>("/api/warehouse"),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
};

const useSuppliers = () => {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => fetcher<SupplierResponse>("/api/suppliers"),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
const createSupplier = async (data: unknown) => {
  const response = await axios.post('/api/suppliers',data);

  return response.data;
};
  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      toast.success('Supplier created successfully', {
        description: 'Supplier created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: error => {
      toast.error('Error', {
        description: error.message,
      });
    },
  });
}
  


export { useLocations, useSuppliers };