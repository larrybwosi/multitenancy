import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  code?: string;
  isActive?: boolean;
}
// Fetch expense categories for an organization
export const useExpenseCategories = ( onlyActive?: boolean ) => {
  return useQuery<ExpenseCategory[]>({
    queryKey: ['expense-categories', onlyActive],
    queryFn: async () => {
      const res = await axios.get('/api/finance/expenses/categories', {
        params: { onlyActive },
      });
      return res.data;
    },
  });
};

// Create a new expense category
export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string; code?: string }) => {
      const res = await axios.post('/api/finance/expenses/categories', data);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate the categories query to refetch
      queryClient.invalidateQueries({
        queryKey: ['expense-categories',],
      });
    },
  });
};

// Update an expense category
export const useUpdateExpenseCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string | null;
      code?: string | null;
      isActive?: boolean;
    }) => {
      const res = await axios.patch(`/api/finance/expenses/categories/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate the categories query to refetch
      // Note: You might need to adjust this based on how you track organizationId
      queryClient.invalidateQueries({
        queryKey: ['expense-categories'],
      });
    },
  });
};

// ... existing hooks ...

// Delete an expense category
export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const res = await axios.delete(`/api/expense-categories/${categoryId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['expense-categories'],
      });
      
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });
};

// Soft delete (deactivate) an expense category
export const useDeactivateExpenseCategory = () => {
  const queryClient = useQueryClient();
  const { mutate: updateCategory } = useUpdateExpenseCategory();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      return updateCategory({ id: categoryId, isActive: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['expense-categories'],
      });
      toast.success('Category deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deactivate category');
    },
  });
};