'use server';
/**
 * M-Pesa Integration Library
 *
 * This module provides functions for integrating with the M-Pesa payment gateway,
 * including STK Push, paybill, and buy goods services.
 */

import axios from 'axios';

// Types
interface MpesaCredentials {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  callbackUrl: string;
}

const credentials: MpesaCredentials = {
  callbackUrl: process.env.MPESA_ENDPOINT!,
  consumerKey: process.env.MPESA_CONSUMER_KEY!,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET!,
  passkey: process.env.PASSKEY!,
  shortcode: process.env.MPESA_SHORT_CODE!,
};
interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

interface MpesaAuthResponse {
  access_token: string;
  expires_in: string;
}

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
 * Get M-Pesa OAuth token
 * @param credentials M-Pesa API credentials
 * @returns Access token
 */
export async function getMpesaToken(): Promise<string> {
  try {
    const auth = Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');

    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting M-Pesa token:', error);
    throw new Error('Failed to get M-Pesa access token');
  }
}

/**
 * Initiate STK Push request
 * @param request STK Push request details
 * @returns STK Push response
 */
export async function initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
  try {
    const token = await getMpesaToken();

    // Format phone number (remove leading zero if present)
    let phoneNumber = request.phoneNumber;
    if (phoneNumber.startsWith('0')) {
      phoneNumber = `254${phoneNumber.substring(1)}`;
    }

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);

    // Generate password
    const password = Buffer.from(`${credentials.shortcode}${credentials.passkey}${timestamp}`).toString('base64');

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: credentials.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline', //BusinessBuyGoods
        Amount: request.amount,
        PartyA: phoneNumber,
        PartyB: credentials.shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: credentials.callbackUrl,
        AccountReference: request.accountReference,
        TransactionDesc: request.transactionDesc,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(response);

    return response.data;
  } catch (error) {
    console.error('Error initiating STK push:', error);
    throw new Error('Failed to initiate STK push');
  }
}

/**
 * Check STK Push transaction status
 * @param credentials M-Pesa API credentials
 * @param checkoutRequestId Checkout request ID from STK push response
 * @returns Transaction status
 */
export async function checkTransactionStatus(credentials: MpesaCredentials, checkoutRequestId: string): Promise<any> {
  try {
    const token = await getMpesaToken();

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);

    // Generate password
    const password = Buffer.from(`${credentials.shortcode}${credentials.passkey}${timestamp}`).toString('base64');

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        BusinessShortCode: credentials.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error checking transaction status:', error);
    throw new Error('Failed to check transaction status');
  }
}

/**
 * Process M-Pesa callback data
 * @param callbackData Callback data from M-Pesa
 * @returns Processed payment details or null if payment failed
 */
function processCallback(callbackData: MpesaCallback): any {
  try {
    const { stkCallback } = callbackData.Body;

    // Check if transaction was successful
    if (stkCallback.ResultCode !== 0) {
      return {
        success: false,
        message: stkCallback.ResultDesc,
        merchantRequestId: stkCallback.MerchantRequestID,
        checkoutRequestId: stkCallback.CheckoutRequestID,
      };
    }

    // Extract payment details
    const metadata = stkCallback.CallbackMetadata?.Item || [];
    const paymentDetails: Record<string, any> = {
      success: true,
      merchantRequestId: stkCallback.MerchantRequestID,
      checkoutRequestId: stkCallback.CheckoutRequestID,
    };

    // Map metadata items to payment details
    metadata.forEach(item => {
      if (item.Name && item.Value !== undefined) {
        paymentDetails[item.Name.toLowerCase()] = item.Value;
      }
    });

    return paymentDetails;
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    return {
      success: false,
      message: 'Failed to process callback data',
    };
  }
}

/**
 * Get M-Pesa credentials from environment variables
 * @returns M-Pesa credentials
 */
function getMpesaCredentialsFromEnv(callbackPath: string): MpesaCredentials {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return {
    consumerKey: process.env.MPESA_CONSUMER_KEY || '',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
    passkey: process.env.MPESA_PASSKEY || '',
    shortcode: process.env.MPESA_SHORTCODE || '',
    callbackUrl: `${baseUrl}${callbackPath}`,
  };
}

/**
 * Validate M-Pesa credentials
 * @param credentials M-Pesa credentials
 * @returns Whether credentials are valid
 */
function validateMpesaCredentials(credentials: MpesaCredentials): boolean {
  return (
    !!credentials.consumerKey &&
    !!credentials.consumerSecret &&
    !!credentials.passkey &&
    !!credentials.shortcode &&
    !!credentials.callbackUrl
  );
}
