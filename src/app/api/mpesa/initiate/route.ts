import { NextResponse } from 'next/server';
import { getServerAuthContext } from '@/actions/auth';
import { db } from '@/lib/db';
// import Pusher from 'pusher';
import { getMpesaToken } from '@/lib/payments/mpesa';

// Initialize Pusher server
// const pusher = new Pusher({
//   appId: process.env.PUSHER_APP_ID!,
//   key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
//   secret: process.env.PUSHER_SECRET!,
//   cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
// });

export async function POST(request: Request) {
  try {
    const authContext = await getServerAuthContext();
    if (!authContext?.memberId || !authContext?.organizationId) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phoneNumber, amount, saleData } = body
    // const amount = 2

    // Validate phone number format (Kenya format)
    const formattedPhone = phoneNumber.startsWith('0') 
      ? `254${phoneNumber.slice(1)}` 
      : phoneNumber.startsWith('+') 
        ? phoneNumber.slice(1) 
        : phoneNumber;

    // Generate unique transaction reference
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
    const shortcode = process.env.MPESA_SHORT_CODE!;
    const passkey = process.env.MPESA_PASSKEY;
    const reference = `INV-${timestamp}${Math.floor(Math.random() * 1000)}`;

    // Generate password
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    

    // Prepare STK Push request
    const stkPushUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    const stkPushBody = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount), // Convert to integer
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: `${process.env.ENDPOINT}/api/mpesa/callback`,
      AccountReference: reference,
      TransactionDesc: `Payment for sale ${reference}`,
    };

    const token = await getMpesaToken();
    // Make STK Push request
    const response = await fetch(stkPushUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(stkPushBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errorMessage || 'Failed to initiate M-Pesa payment');
    }

    console.log(data);
    // Store payment request in database
    await db.mpesaPaymentRequest.create({
      data: {
        organizationId: authContext.organizationId,
        memberId: authContext.memberId,
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
        amount: amount,
        phoneNumber: formattedPhone,
        reference: reference,
        status: 'PENDING',
        saleData: saleData,
      },
    });

    return NextResponse.json({
      CheckoutRequestID: data.CheckoutRequestID,
      MerchantRequestID: data.MerchantRequestID,
      CustomerMessage: data.CustomerMessage,
    });
  } catch (error) {
    console.error('M-Pesa payment initiation error:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to initiate payment' },
      { status: 500 }
    );
  }
} 