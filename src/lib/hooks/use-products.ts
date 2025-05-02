import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { AddProductMinimalSchema } from '../validations/product';
import { z } from 'zod';
import { EditProductFormData } from '@/app/(org)/products/components/edit-product-dialog';

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
    gcTime: 1000 * 60 * 20, // 10 minutes
  });
}

type ProductFormValues = z.infer<typeof AddProductMinimalSchema>;

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    // Create formData object from form values
    mutationKey: ['createProduct'],

    mutationFn: (data: ProductFormValues) => {
      return axios.post('/api/products/create', data);
    },
    onSuccess: () => {
      toast.success('Product created', {
        description: 'Your product has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: AxiosError<{message?: string}>) => {
      toast.error('Failed to create product', {
        description: error.response?.data?.message || 'Failed to create product. Please try again.',
      });
      console.error('Error creating product:', error);
    },
  });
}

export interface GetProductsOptions {
  includeVariants?: boolean;
  includeCategory?: boolean; // To explicitly control category inclusion
  includeSuppliers?: boolean;
  includeDefaultLocation?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  // Updated sortBy to reflect Product fields primarily. Variant price sorting is complex.
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'sku';
  sortOrder?: 'asc' | 'desc';
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteProduct'],
    mutationFn: (productId: string) => {
      return axios.delete(`/api/products/${productId}`);
    },
    onSuccess: (p) => {
      toast.success(`${p?.data?.name||'Product'} deleted`, {
        description: 'Your product has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: AxiosError<{message?: string}>) => {
      toast.error('Failed to delete product', {
        description: error.response?.data?.message || 'Failed to delete product. Please try again.',
      });
      console.error('Error deleting product:', error);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['updateProduct'],
    mutationFn: (data: EditProductFormData) => {
      
      const formData = new FormData();

      // Append all data to formData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === 'boolean') {
            formData.append(key, value ? 'true' : 'false');
          } else if (Array.isArray(value)) {
            // Handle arrays (like imageUrls)
            value.forEach((item, index) => {
              formData.append(`${key}[${index}]`, item);
            });
          } else {
            formData.append(key, value as string | Blob);
          }
        }
      });
      
      return axios.put(`/api/products/${data.id}`, formData);
    },
    onSuccess: (response) => {
      const productName = response.data?.data?.product?.name || 'Product';
      toast.success(`${productName} updated`, {
        description: 'Your product has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: AxiosError<{message?: string}>) => {
      toast.error('Failed to update product', {
        description: error.response?.data?.message || 'Failed to update product. Please try again.',
      });
      console.error('Error updating product:', error);
    },
  });
}