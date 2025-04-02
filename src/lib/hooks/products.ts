"use server";

import {
  getProducts,
  getProductById,
  searchProducts,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/actions/products";
import useSWR from "swr";

// Product hooks
export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/products",
    async () => {
      return await getProducts();
    }
  );

  return {
    products: data || [],
    isLoading,
    error,
    mutateProducts: mutate,
  };
}

export function useProduct(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/products/${id}`,
    async () => {
      return await getProductById(id);
    }
  );

  return {
    product: data,
    isLoading,
    error,
    mutateProduct: mutate,
  };
}

export function useProductSearch(query: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/products/search?q=${query}`,
    async () => {
      return await searchProducts(query);
    },
    {
      revalidateOnFocus: false,
    }
  );

  return {
    results: data || [],
    isLoading,
    error,
    mutateResults: mutate,
  };
}

export function useProductByBarcode(barcode: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/products/barcode/${barcode}`,
    async () => {
      return await getProductByBarcode(barcode);
    }
  );

  return {
    product: data,
    isLoading,
    error,
    mutateProduct: mutate,
  };
}

// Mutation functions
export async function useCreateProduct(productData: any) {
  return await createProduct(productData);
}

export async function useUpdateProduct(id: number, productData: any) {
  return await updateProduct(id, productData);
}

export async function useDeleteProduct(id: number) {
  return await deleteProduct(id);
}
