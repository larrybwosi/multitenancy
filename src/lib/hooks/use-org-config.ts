import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Fetch organization expense configuration
export const useOrganizationExpenseConfig = () => {
  return useQuery({
    queryKey: ['organization-expense-config'],
    queryFn: async () => {
      const res = await axios.get(`/api/organization/settings/expense-config`);
      return res.data;
    },
  });
};

// Update organization expense configuration
export const useUpdateOrganizationExpenseConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ...configData
    }: {
      expenseApprovalRequired?: boolean;
      expenseApprovalThreshold?: number | null;
      expenseReceiptRequired?: boolean;
      expenseReceiptThreshold?: number | null;
      defaultExpenseCurrency?: string;
      expenseApprovalChain?: any;
      expenseTagOptions?: string[];
    }) => {
      const res = await axios.patch(`/api/organization/settings/expense-config`, configData);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate the config query to refetch
      queryClient.invalidateQueries({
        queryKey: ['organization-expense-config'],
      });
    },
  });
};
