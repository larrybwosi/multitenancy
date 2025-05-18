import { Supplier } from "@/prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";


interface ProductSupplier {
  id: string;
  supplierId: string;
  supplierSku?: string | null;
  costPrice: number | string;
  minimumOrderQuantity?: number | null;
  packagingUnit?: string | null;
  isPreferred: boolean;
  supplier: {
    id: string;
    name: string;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
  };
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

const useSuppliers = () => {
  const { data, isLoading, error}= useQuery({
    queryKey: ["suppliers"],
    queryFn: () => axios.get<SupplierResponse>("/api/suppliers"),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
  return { data: data?.data, isLoading, error}
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
      console.error('Error creating supplier:', error);
      toast.error('Error', {
        description: error.message,
      });
    },
  });
}
  


export { useSuppliers };