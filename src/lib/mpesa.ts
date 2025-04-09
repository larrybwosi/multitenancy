'use server'

/**
 * M-Pesa Integration Library
 *
 * This module provides functions for integrating with the M-Pesa payment gateway,
 * including STK Push functionality via Daraja API.
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

export interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

// Load credentials from environment variables
const credentials: MpesaCredentials = {
  callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://example.com/api/mpesa/callback',
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  passkey: process.env.MPESA_PASSKEY || '',
  shortcode: process.env.MPESA_SHORTCODE || '',
};

/**
 * Get M-Pesa access token
 * @returns Access token for M-Pesa API
 */
export async function getMpesaToken(): Promise<string> {
  try {
    const auth = Buffer.from(
      `${credentials.consumerKey}:${credentials.consumerSecret}`
    ).toString('base64');

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
export async function initiateSTKPush(
  request: STKPushRequest,
): Promise<STKPushResponse> {
  try {
    const token = await getMpesaToken();

    // Format phone number (remove leading zero if present)
    let phoneNumber = request.phoneNumber;
    if (phoneNumber.startsWith('0')) {
      phoneNumber = `254${phoneNumber.substring(1)}`;
    }

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 14);

    // Generate password
    const password = Buffer.from(`${credentials.shortcode}${credentials.passkey}${timestamp}`).toString('base64');

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: credentials.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
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

    return response.data;
  } catch (error) {
    console.error('Error initiating STK push:', error);
    throw new Error('Failed to initiate STK push');
  }
}

/**
 * Check STK Push transaction status
 * @param checkoutRequestId Checkout request ID from STK push response
 * @returns Transaction status
 */
export async function checkTransactionStatus(checkoutRequestId: string): Promise<{
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
}> {
  try {
    const token = await getMpesaToken();

    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 14);

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