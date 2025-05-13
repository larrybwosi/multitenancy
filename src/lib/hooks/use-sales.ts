
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
    staleTime: 10 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });
}

interface SalesSummary {
  totalSales: number;
  salesCount: number;
  totalTax: number;
  totalDiscount: number;
  totalProfit: number;
  itemsSold: number;
  uniqueCustomers: number;
  averageSaleValue: number;
  salesGrowth: number;
}

export function useSalesSummary(dateRange?: string) {
  return useQuery<SalesSummary>({
    queryKey: ["salesSummary", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange) params.append("dateRange", dateRange);
      
      const response = await fetch(`/api/sales/summary?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    },
  });
}