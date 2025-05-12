import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { ProductVariantSchema, ProductSupplierSchema } from '../validations/product';
import { z } from 'zod';

export type ProductDetailQueryOptions = {
  id: string;
};

// Types based on schemas
export type ProductVariantInput = z.infer<typeof ProductVariantSchema>;
export type ProductSupplierInput = z.infer<typeof ProductSupplierSchema>;

export function useProductDetail(options: ProductDetailQueryOptions) {
  const { id } = options;
  const queryKey = ['product', id];

  const queryFn = async () => {
    const response = await fetch(`/api/products/${id}/product`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch product details');
    }

    return response.json();
  };

  return useQuery({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!id, // Only run the query if id is provided
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['updateVariant'],
    mutationFn: (data: ProductVariantInput & { id: string }) => {
      return axios.put(`/api/products/variants/${data.id}`, data);
    },
    onSuccess: (response) => {
      toast.success('Variant updated', {
        description: 'The variant has been successfully updated.',
      });
      
      // Find which product this belongs to to invalidate the right query
      const productId = response.data?.data?.productId;
      if (productId) {
        queryClient.invalidateQueries({ queryKey: ['product', productId] });
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: AxiosError<{message?: string}>) => {
      toast.error('Failed to update variant', {
        description: error.response?.data?.message || 'Failed to update variant. Please try again.',
      });
      console.error('Error updating variant:', error);
    },
  });
}

export function useAddVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['addVariant'],
    mutationFn: (data: ProductVariantInput & { productId: string }) => {
      return axios.post(`/api/products/variants`, data);
    },
    onSuccess: (response) => {
      toast.success('Variant added', {
        description: 'The variant has been successfully added.',
      });
      
      // Find which product this belongs to to invalidate the right query
      const productId = response.data?.data?.productId;
      if (productId) {
        queryClient.invalidateQueries({ queryKey: ['product', productId] });
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: AxiosError<{message?: string}>) => {
      toast.error('Failed to add variant', {
        description: error.response?.data?.message || 'Failed to add variant. Please try again.',
      });
      console.error('Error adding variant:', error);
    },
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteVariant'],
    mutationFn: ({ id, productId }: { id: string, productId: string }) => {
      return axios.delete(`/api/products/variants/${id}`);
    },
    onSuccess: (_, variables) => {
      toast.success('Variant deleted', {
        description: 'The variant has been successfully deleted.',
      });
      
      // Invalidate appropriate queries
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: AxiosError<{message?: string}>) => {
      toast.error('Failed to delete variant', {
        description: error.response?.data?.message || 'Failed to delete variant. Please try again.',
      });
      console.error('Error deleting variant:', error);
    },
  });
}

export function useAddProductSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['addProductSupplier'],
    mutationFn: (data: ProductSupplierInput & { productId: string }) => {
      return axios.post(`/api/products/suppliers`, {
        ...data,
        productId: data.productId
      });
    },
    onSuccess: (response, variables) => {
      toast.success('Supplier added', {
        description: 'The supplier has been successfully added to the product.',
      });
      
      // Invalidate product data using the productId from the variables
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: AxiosError<{message?: string}>) => {
      toast.error('Failed to add supplier', {
        description: error.response?.data?.message || 'Failed to add supplier. Please try again.',
      });
      console.error('Error adding supplier:', error);
    },
  });
}

export function useUpdateProductSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['updateProductSupplier'],
    mutationFn: (data: ProductSupplierInput & { id: string, productId: string }) => {
      return axios.put(`/api/products/suppliers`, {
        ...data,
        id: data.id,
        productId: data.productId
      });
    },
    onSuccess: (_, variables) => {
      toast.success('Supplier updated', {
        description: 'The supplier information has been successfully updated.',
      });
      
      // Invalidate appropriate queries
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: AxiosError<{message?: string}>) => {
      toast.error('Failed to update supplier', {
        description: error.response?.data?.message || 'Failed to update supplier. Please try again.',
      });
      console.error('Error updating supplier:', error);
    },
  });
}

export function useDeleteProductSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['deleteProductSupplier'],
    mutationFn: ({ id, productId }: { id: string, productId: string }) => {
      return axios.delete(`/api/products/suppliers?id=${id}`);
    },
    onSuccess: (_, variables) => {
      toast.success('Supplier removed', {
        description: 'The supplier has been successfully removed from the product.',
      });
      
      // Invalidate appropriate queries
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: AxiosError<{message?: string}>) => {
      toast.error('Failed to remove supplier', {
        description: error.response?.data?.message || 'Failed to remove supplier. Please try again.',
      });
      console.error('Error removing supplier:', error);
    },
  });
} 