import { useQuery } from "@tanstack/react-query";

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

interface Supplier {
  id: string;
  name: string;
}

interface WarehouseResponse {
  warehouses: Warehouse[];
}

interface SupplierResponse {
  data: Supplier[];
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
  return useQuery<SupplierResponse>({
    queryKey: ["suppliers"],
    queryFn: () => fetcher<SupplierResponse>("/api/suppliers"),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}

export { useLocations, useSuppliers };