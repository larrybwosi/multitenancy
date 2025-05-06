import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CreateExpense, ListExpensesFilter } from '../validations/expenses';
// import { Expense } from '@/prisma/client';
// import { CreateExpenseSchema, Expense, ExpenseStatus, ListExpensesFilter } from '@/lib/validations/expenses';

// Define a more comprehensive type for Expense
export interface Expense {
  id: string;
  description: string;
  amount: string | number;
  createdAt: string;
  expenseDate: string;
  expenseNumber: string;
  category: { name: string };
  status: string;
  member?: { user?: { name: string } };
  paymentMethod: string;
  notes?: string | null;
  receiptUrl?: string | null;
  isBillable: boolean;
  isReimbursable: boolean;
  approver?: { user?: { name: string } };
  approvalDate?: string;
  tags: string[];
  taxAmount?: number | null;
  mileage?: number | null;
  supplierId?: string | null;
  locationId?: string | null;
}

// Helper function for API calls
const apiFetch = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Something went wrong');
  }
  return response.json();
};

// Query keys
export const expenseKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseKeys.all, 'list'] as const,
  list: (filters: ListExpensesFilter) => [...expenseKeys.lists(), filters] as const,
  details: () => [...expenseKeys.all, 'detail'] as const,
  detail: (id: string) => [...expenseKeys.details(), id] as const,
};

/**
 * Fetches a list of expenses with optional filters
 */
export const useExpenses = (filters: ListExpensesFilter = {}, enabled?: boolean) => {
  const queryString = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryString.append(key, String(value));
    }
  });

  return useQuery<Expense[], Error>({
    queryKey: expenseKeys.list(filters),
    queryFn: () => apiFetch(`/api/finance/expenses?${queryString.toString()}`),
    enabled
  });
};

/**
 * Fetches a single expense by ID
 */
export const useExpense = (id: string) => {
  return useQuery<Expense, Error>({
    queryKey: expenseKeys.detail(id),
    queryFn: () => apiFetch(`/api/expenses/${id}`),
    enabled: !!id,
  });
};

/**
 * Creates a new expense
 */
export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, CreateExpense>({
    mutationFn: data =>
      apiFetch('/api/finance/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success('Expense created successfully');
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
    },
    onError: error => {
      toast.error('Failed to create expense', {
        description: error.message,
      });
    },
  });
};

/**
 * Approves an expense
 */
export const useApproveExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, { id: string; comments?: string }>({
    mutationFn: ({ id, comments }) =>
      apiFetch(`/api/expenses/${id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comments }),
      }),
    onSuccess: (data, variables) => {
      toast.success('Expense approved');
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(variables.id) });
    },
    onError: error => {
      toast.error('Failed to approve expense', {
        description: error.message,
      });
    },
  });
};

/**
 * Rejects an expense
 */
export const useRejectExpense = () => {
  const queryClient = useQueryClient();

  return useMutation<Expense, Error, { id: string; comments: string }>({
    mutationFn: ({ id, comments }) =>
      apiFetch(`/api/expenses/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comments }),
      }),
    onSuccess: (data, variables) => {
      toast.success('Expense rejected');
      queryClient.invalidateQueries({ queryKey: expenseKeys.lists() });
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(variables.id) });
    },
    onError: error => {
      toast.error('Failed to reject expense', {
        description: error.message,
      });
    },
  });
};
