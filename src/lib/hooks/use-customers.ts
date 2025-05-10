import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { Customer } from '@/prisma/client';
import { CustomerFormValues } from '../validations/customers';


const api = axios.create({
  baseURL: '/api',
});

export const useCustomers = (params: {
  query?: string;
  status?: 'active' | 'inactive' | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      try {
        const response = await api.get('/customers', { params });
        return response.data as {
          success: boolean;
          data: {
            customers: Customer[];
            totalCount: number;
            totalPages: number;
          };
        };
      } catch (error) {
        return handleError(error, 'Failed to fetch customers');
      }
    },
    staleTime: 1000 * 60 * 10, // 5 minutes
    gcTime: 1000 * 60 * 20, // 10 minutes
  });
};


export function useCustomerById(customerId: string) {
  return useQuery({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      const res = await axios.get(`/api/customers/${customerId}`);
      if (res.status !== 200) {
        throw new Error('Failed to fetch customer');
      }
      return res.data;
    },
    enabled: !!customerId,
  });
}
export function useCreateCustomer(customer?: { id?: string; name: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const response = await fetch('/api/customers', {
        method: customer?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save customer');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch customers list after mutation
      queryClient.invalidateQueries({ queryKey: ['customers'] });

      // Show success toast
      toast.success(customer?.id ? 'Customer Updated' : 'Customer Created', {
        description: customer?.id
          ? `${customer.name} has been successfully updated.`
          : 'New customer has been successfully added.',
        duration: 3000,
      });
    },
    onError: (error: Error) => {
      toast.error(`Failed to ${customer?.id ? 'update' : 'create'} customer`, {
        description: error.message || 'Something went wrong. Please try again.',
        duration: 5000,
      });
    },
  });
}

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const response = await api.delete(`/customers/${id}`);
        return response.data as {
          success: boolean;
          data: { id: string };
          message?: string;
        };
      } catch (error) {
        return handleError(error, 'Failed to delete customer');
      }
    },
    onSuccess: data => {
      if (data.success) {
        toast.success(data.message || 'Customer deleted successfully');
        queryClient.invalidateQueries({
          queryKey: ['customers'],
        });
      }
    },
  });
};

const handleError = (error: any, defaultMessage: string) => {
  console.error(error);
  const message = error.response?.data?.message || defaultMessage;
  toast.error(message);
  throw new Error(message);
};