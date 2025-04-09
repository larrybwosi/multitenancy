'use server'

import { initiateSTKPush } from '@/lib/mpesa';
import { revalidatePath } from 'next/cache';
import { SaleData } from '../types';

/**
 * Process M-Pesa payment for a sale
 */
export async function processMpesaPayment(saleData: SaleData) {
  try {
    if (!saleData.phoneNumber) {
      throw new Error('Phone number is required for M-Pesa payments');
    }
    
    // Format the amount to ensure it's a valid number
    const amount = Math.round(parseFloat(saleData.totalAmount));
    
    // Generate a unique transaction reference
    const transactionRef = `INV-${Date.now().toString().slice(-8)}`;
    
    console.log('Initiating M-Pesa payment for:', {
      phoneNumber: saleData.phoneNumber,
      amount,
      transactionRef
    });
    
    // Call the STK Push function
    const stkResponse = await initiateSTKPush({
      phoneNumber: saleData.phoneNumber,
      amount,
      accountReference: transactionRef,
      transactionDesc: `Payment for invoice ${transactionRef}`
    });
    
    // Store the STK request in your database for tracking
    // This is just an example; implement actual database storage
    // await prisma.mpesaTransaction.create({
    //   data: {
    //     merchantRequestId: stkResponse.MerchantRequestID,
    //     checkoutRequestId: stkResponse.CheckoutRequestID,
    //     amount: amount.toString(),
    //     phoneNumber: saleData.phoneNumber,
    //     status: 'PENDING',
    //     saleReference: transactionRef,
    //   }
    // });
    
    // Revalidate the page to reflect the changes
    revalidatePath('/point');
    
    return {
      success: true,
      message: 'M-Pesa payment initiated. Please check your phone to complete the transaction.',
      transactionRef,
      checkoutRequestId: stkResponse.CheckoutRequestID
    };
  } catch (error) {
    console.error('M-Pesa payment failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process M-Pesa payment',
    };
  }
} 