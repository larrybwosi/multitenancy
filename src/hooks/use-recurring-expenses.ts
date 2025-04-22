import { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/use-organization';
import { toast } from 'sonner';

type RecurringExpense = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  frequency: string;
  nextDueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

type PaginationState = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type RecurringExpensesParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useRecurringExpenses(initialParams: RecurringExpensesParams = {}) {
  const { organization } = useOrganization();
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    page: initialParams.page || 1,
    limit: initialParams.limit || 10,
    totalPages: 0,
  });
  const [params, setParams] = useState<RecurringExpensesParams>(initialParams);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    if (!organization) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Construct query parameters
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
      
      const response = await fetch(`/api/organizations/${organization.id}/finance/recurring-expenses?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recurring expenses');
      }
      
      const data = await response.json();
      setExpenses(data.expenses);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error("Error", {
        description: "Failed to load recurring expenses. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organization) {
      fetchExpenses();
    }
  }, [organization, params.page, params.limit, params.sortBy, params.sortOrder]);

  const updateParams = (newParams: Partial<RecurringExpensesParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  };

  const search = (term: string) => {
    updateParams({ search: term, page: 1 });
    fetchExpenses();
  };

  return {
    expenses,
    pagination,
    isLoading,
    error,
    search,
    updateParams,
    refresh: fetchExpenses,
  };
}