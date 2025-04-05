import axios from "axios";
import { Prisma, Transaction } from "@prisma/client";
import { db as prisma } from "@/lib/db";

interface StkPushRequestResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage?: string;
}

interface DarajaAuthResponse {
  access_token: string;
  expires_in: string;
}

export async function getDarajaAccessToken(
  consumerKey: string,
  consumerSecret: string
): Promise<string> {
  const auth = Buffer.from(
    `<span class="math-inline">\{consumerKey\}\:</span>{consumerSecret}`
  ).toString("base64");
  const response = await axios.get<DarajaAuthResponse>(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    }
  );
  return response.data.access_token;
}
export async function initiateStkPush(
  accessToken: string,
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string,
  callbackURL: string,
  businessShortCode: string,
  passkey: string
): Promise<StkPushRequestResponse> {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .substring(0, 14);
  const password = Buffer.from(
    `<span class="math-inline">\{businessShortCode\}</span>{passkey}${timestamp}`
  ).toString("base64");

  const payload = {
    BusinessShortCode: businessShortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline", // Or 'CustomerBuyGoodsOnline'
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: businessShortCode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackURL,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  const response = await axios.post<StkPushRequestResponse>(
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
  return response.data;
}

export async function createTransaction(
  description: string | null,
  amount: Prisma.Decimal
): Promise<Transaction> {
  return prisma.transaction.create({
    data: {
      description,
      amount,
      status: "Pending", // Initial status
    },
  });
}

export async function createPaymentRecord(
  transactionId: string,
  merchantRequestID: string | null,
  checkoutRequestID: string | null
): Promise<Payment> {
  return prisma.payment.create({
    data: {
      transactionId,
      merchantRequestID,
      checkoutRequestID,
    },
  });
}

export async function updatePaymentStatus(
  checkoutRequestID: string,
  callbackData: any
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { checkoutRequestID },
    });
    if (payment) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          mpesaReceiptNumber:
            callbackData?.Body?.stkCallback?.CallbackMetadata?.Item?.find(
              (item: any) => item.Name === "MpesaReceiptNumber"
            )?.Value,
          transactionStatus: callbackData?.Body?.stkCallback?.ResultDesc,
          callbackRaw: callbackData,
        },
      });

      // Optionally update the Transaction status based on payment status
      const updatedPayment = await tx.payment.findUnique({
        where: { id: payment.id },
        include: { transaction: true },
      });
      if (updatedPayment?.transaction) {
        let newTransactionStatus = updatedPayment.transaction.status;
        if (
          updatedPayment.transactionStatus ===
          "Success. Request accepted for processing"
        ) {
          newTransactionStatus = "Completed";
        } else if (
          updatedPayment.transactionStatus?.startsWith("Request cancelled")
        ) {
          newTransactionStatus = "Failed";
        }
        await tx.transaction.update({
          where: { id: updatedPayment.transactionId },
          data: { status: newTransactionStatus },
        });
      }
    }
  });
}