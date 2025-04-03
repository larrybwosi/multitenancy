"use client";

import useSWR from "swr";
import { Category } from "../types";

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR(
    "categories",
    getCategories,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    supplierHistory: (data as Category[]) || [],
    isLoading,
    isError: error,
    mutate,
  };
}
