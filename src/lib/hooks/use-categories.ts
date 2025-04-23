"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  CategoryWithStats,
  GetCategoriesWithStatsParams,
} from "@/actions/category.actions";

const API_BASE_URL = "/api/categories";

// Hook for fetching categories with stats
export function useCategories(params: GetCategoriesWithStatsParams = {}) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: async () => {
      const response = await axios.get(API_BASE_URL, { params });
      return response.data as {
        data: CategoryWithStats[];
        totalItems: number;
        totalPages: number;
      };
    },
    refetchOnMount:false
  });
}

// Hook for fetching category options (for dropdowns)
export function useCategoryOptions() {
  return useQuery({
    queryKey: ["category-options"],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/options`);
      return response.data as { value: string; label: string }[];
    },
  });
}

// Hook for saving (creating/updating) a category
export function useSaveCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await axios.post(API_BASE_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category-options"] });
    },
  });
}

// Hook for deleting a category
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(API_BASE_URL, { data: { id } });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category-options"] });
    },
  });
}
