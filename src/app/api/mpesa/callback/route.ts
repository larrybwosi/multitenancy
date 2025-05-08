// API route for handling M-Pesa callbacks
import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/db';
import Pusher from 'pusher';

// Initialize Pusher server
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

interface MpesaMetadataItem {
  Name: string;
  Value: string | number;
}

/**
 * Process M-Pesa callback and update payment status
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log(body);
    const { Body: { stkCallback } } = body;

    // Extract callback data
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // Find the payment request
    const paymentRequest = await db.mpesaPaymentRequest.findFirst({
      where: {
        checkoutRequestId: CheckoutRequestID,
        merchantRequestId: MerchantRequestID,
      },
    });

    if (!paymentRequest) {
      throw new Error('Payment request not found');
    }

    // Determine payment status
    const status = ResultCode === 0 ? 'SUCCESS' : 'FAILED';
    const metadata = CallbackMetadata?.Item || [];

    // Update payment request status
    await db.mpesaPaymentRequest.update({
      where: { id: paymentRequest.id },
      data: {
        status,
        resultCode: ResultCode,
        resultDescription: ResultDesc,
        mpesaReceiptNumber: metadata.find((item: MpesaMetadataItem) => item.Name === 'MpesaReceiptNumber')?.Value as string,
        transactionDate: metadata.find((item: MpesaMetadataItem) => item.Name === 'TransactionDate')?.Value as string,
        phoneNumber: metadata.find((item: MpesaMetadataItem) => item.Name === 'PhoneNumber')?.Value as string,
      },
    });

    // If payment was successful, process the sale
    if (status === 'SUCCESS' && paymentRequest.saleData) {
      console.log('Processing sale...', paymentRequest.saleData);
      // Process the sale using the stored sale data
      // This will be handled by your existing sale processing logic
      // You might want to call your processSale function here
    }

    // Notify the client about the payment status
    await pusher.trigger('mpesa-payments', 'payment-status', {
      status,
      checkoutRequestId: CheckoutRequestID,
      merchantRequestId: MerchantRequestID,
      responseCode: ResultCode,
      responseDescription: ResultDesc,
      customerMessage: status === 'SUCCESS' 
        ? 'Payment successful! Your order will be processed shortly.'
        : 'Payment failed. Please try again.',
    });

    return NextResponse.json({ message: 'Callback processed successfully' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to process callback' },
      { status: 500 }
    );
  }
} 