import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { CustomerFormValues } from "../validations/customers";

export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const res = await axios.get("/api/customers");
      if (res.status !== 200) {
        throw new Error("Failed to fetch customers");
      }
      return res.data;
    },
  });
}

export function useCustomerById(customerId: string) {
  return useQuery({
    queryKey: ["customer", customerId],
    queryFn: async () => {
      const res = await axios.get(`/api/customers/${customerId}`);
      if (res.status !== 200) {
        throw new Error("Failed to fetch customer");
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
          'Content-Type': 'application/json',
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