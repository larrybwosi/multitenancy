import { SaleResult } from '@/app/pos/components/cart';
import { PaymentMethod } from '@/prisma/client';
import { generateAndSaveReceiptPdf } from '@/utils/pdf';
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


export const receiptGenerationTest = async ()=>{
  const data = {
      id: 'cmac97tjv0014bk4gkwihhcfu',
      saleNumber: 'SALE-509009-5COA',
      customerId: null,
      memberId: 'user-org-dealio-inc-Ik3zInLsch95czAOmyncXKaAedTuBKfa',
      saleDate: new Date('2025-05-06T08:35:09.012Z'),
      totalAmount: '408',
      discountAmount: '0',
      taxAmount: '0',
      finalAmount: '408',
      paymentMethod: 'CASH',
      paymentStatus: 'COMPLETED',
      locationId: 'cma5if0jb0002bk7s3v5sfa23',
      notes: '',
      cashDrawerId: null,
      receiptUrl: null,
      createdAt: new Date('2025-05-06T08:35:09.019Z'),
      updatedAt: new Date('2025-05-06T08:35:09.019Z'),
      organizationId: 'org-dealio-inc',
      items: [
        {
          id: 'cmac97tjv0015bk4gy1idql7g',
          saleId: 'cmac97tjv0014bk4gkwihhcfu',
          variantId: 'cma5tesv20002bksojs3ocgg4',
          stockBatchId: null,
          quantity: 1,
          unitPrice: '138',
          unitCost: '0',
          discountAmount: '0',
          taxRate: '0',
          taxAmount: '0',
          totalAmount: '138',
          createdAt: new Date('2025-05-06T08:35:09.019Z'),
          updatedAt: new Date('2025-05-06T08:35:09.019Z'),
          variant: {
            id: 'cma5tesv20002bksojs3ocgg4',
            name: 'Default - Oraimo Cable',
            sku: 'VAR-PROD-8F46E--DEFAULT',
            product: {
              id: 'cma5tesv10001bkso1b5bqvak',
              name: 'Oraimo Cable',
              category: {
                name: 'Electronics',
              },
            },
          },
        },
        {
          id: 'cmac97tjv0016bk4gvx36gckr',
          saleId: 'cmac97tjv0014bk4gkwihhcfu',
          variantId: 'cma6vx3gg0002bkmsslxx99tg',
          stockBatchId: null,
          quantity: 1,
          unitPrice: '270',
          unitCost: '0',
          discountAmount: '0',
          taxRate: '0',
          taxAmount: '0',
          totalAmount: '270',
          createdAt: new Date('2025-05-06T08:35:09.019Z'),
          updatedAt: new Date('2025-05-06T08:35:09.019Z'),
          variant: {
            id: 'cma6vx3gg0002bkmsslxx99tg',
            name: 'Default - Some New Product',
            sku: 'VAR-PROD-98429--DEFAULT',
            product: {
              id: 'cma6vx3gf0001bkmsdcrjjg8r',
              name: 'Huawei',
              category: {
                name: 'Foods',
              },
            },
          },
        },
      ],
      customer: null,
      member: {
        id: 'user-org-dealio-inc-Ik3zInLsch95czAOmyncXKaAedTuBKfa',
        user: {
          name: 'Larry Dean',
        },
      },
      organization: {
        id: 'org-dealio-inc',
        name: 'Dealio Inc',
        logo: 'https://i.pinimg.com/736x/af/63/0d/af630de0e36a6ebb056478328941a175.jpg',
      },
      location: {
        id: 'cma5if0jb0002bk7s3v5sfa23',
        name: 'Main Store',
      },
    };
  const pdf = await generateAndSaveReceiptPdf(data);

  return pdf;
}

