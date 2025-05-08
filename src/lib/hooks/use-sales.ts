
import { Sale } from "@/prisma/client";
import { useQuery } from "@tanstack/react-query";

interface SaleWithCustomer extends Sale {
  customer?: {
    name: string;
    email?: string;
  };
  items?: {
    variant: {
      name: string;
      sku: string;
      retailPrice: number;
      product: {
        imageUrls: string[] | null;
        name: string;
      };
    };
    quantity: number;
    price: number;
  }[];
}

const fetchSaleDetails = async (id: string): Promise<SaleWithCustomer> => {
  const response = await fetch(`/api/sales/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch sale details');
  }
  return response.json();
};

export function useGetSale(saleId?: string | null) {
  return useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => (saleId ? fetchSaleDetails(saleId) : Promise.reject('No sale ID')),
    enabled: !!saleId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}