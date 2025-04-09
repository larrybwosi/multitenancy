// API route for handling M-Pesa callbacks
import { NextRequest, NextResponse } from "next/server";

// Define the type for callback data
interface MpesaCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value?: string | number;
        }>;
      };
    };
  };
}

/**
 * Process M-Pesa callback and update payment status
 */
export async function POST(request: NextRequest) {
  try {
    const callbackData: MpesaCallback = await request.json();
    
    // Extract the checkout request ID
    const { CheckoutRequestID, ResultCode, ResultDesc } = callbackData.Body.stkCallback;
    
    console.log('M-Pesa callback received:', {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    });

    // If the payment was successful (ResultCode 0)
    if (ResultCode === 0) {
      // Extract payment details from callback metadata
      const metadataItems = callbackData.Body.stkCallback.CallbackMetadata?.Item || [];
      
      const mpesaReceiptNumber = metadataItems.find(item => item.Name === 'MpesaReceiptNumber')?.Value as string;
      const amount = metadataItems.find(item => item.Name === 'Amount')?.Value as number;
      const phoneNumber = metadataItems.find(item => item.Name === 'PhoneNumber')?.Value as string;
      
      // Log successful payment
      console.log('Payment successful:', {
        mpesaReceiptNumber,
        amount,
        phoneNumber,
      });
      
      // TODO: Update payment status in database
      // This would typically involve:
      // 1. Finding the pending transaction by CheckoutRequestID
      // 2. Updating it with the payment details
      // 3. Marking it as completed
      
      // Example:
      // await db.payment.update({
      //   where: { checkoutRequestId: CheckoutRequestID },
      //   data: {
      //     status: 'COMPLETED',
      //     mpesaReceiptNumber,
      //     amount: amount.toString(),
      //   },
      // });
    } else {
      // Log failed payment
      console.log('Payment failed:', { ResultCode, ResultDesc });
      
      // TODO: Update payment status in database as failed
      // await db.payment.update({
      //   where: { checkoutRequestId: CheckoutRequestID },
      //   data: {
      //     status: 'FAILED',
      //     failureReason: ResultDesc,
      //   },
      // });
    }

    // Always respond with success to the M-Pesa service
    return NextResponse.json({ 
      ResultCode: 0, 
      ResultDesc: "Callback received successfully" 
    });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    
    // Still return success to M-Pesa even if we had an internal error
    return NextResponse.json({ 
      ResultCode: 0, 
      ResultDesc: "Callback acknowledged" 
    });
  }
} 