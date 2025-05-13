import { SaleResult } from '@/app/pos/types';
import { PaymentMethod } from '@/prisma/client';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

interface Result {
  data: SaleResult;
  message: string;
}

interface ProcessSaleInput {
  cartItems: Array<{
    productId: string;
    variantId: string | null;
    quantity: number;
  }>;
  locationId: string;
  customerId?: string;
  paymentMethod: PaymentMethod;
  discountAmount?: number;
  notes?: string;
  enableStockTracking: boolean;
}

const submitSale = async (processData: ProcessSaleInput): Promise<Result> => {
  const response = await axios.post('/api/pos', processData, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// Hook for submitting sale with TanStack Query
export const useSubmitSale = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: submitSale,
    onSuccess: async result => {
      toast.success('Sale completed successfully',{
        description: `${result?.message}`
      });
      return result;
    },
    // eslint-disable-next-line
    onError: (error: any) => {
      console.error('Error processing sale:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process sale';
      toast.error(errorMessage);
      throw error;
    },
  });

  return { mutateAsync, isLoading: isPending };
};

