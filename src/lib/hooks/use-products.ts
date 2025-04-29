import { useQuery } from '@tanstack/react-query';

export type ProductsQueryOptions = {
  includeVariants?: boolean;
  includeCategory?: boolean;
  includeSuppliers?: boolean;
  includeDefaultLocation?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  sortBy?: 'name' | 'createdAt' | 'basePrice';
  sortOrder?: 'asc' | 'desc';
};

export function useProducts(options: ProductsQueryOptions = {}) {
  const queryKey = ['products', options];

  const queryFn = async () => {
    const params = new URLSearchParams();

    // Append all options as query parameters
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`/api/products?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch products');
    }

    return response.json();
  };

  return useQuery({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
