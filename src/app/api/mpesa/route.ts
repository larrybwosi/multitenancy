// Example using Next.js App Router in app/api/payments/callback/route.ts
import { updatePaymentStatus } from "@/utils/payment";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json();
    const checkoutRequestID =
      callbackData?.Body?.stkCallback?.CheckoutRequestID;

    if (checkoutRequestID) {
      await updatePaymentStatus(checkoutRequestID, callbackData);
    } else {
      console.error(
        "CheckoutRequestID not found in callback data:",
        callbackData
      );
    }

    // Respond to Daraja API to acknowledge receipt
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    console.error("Error processing Daraja callback:", error);
    return NextResponse.json({ ResultCode: 1, ResultDesc: "Failed" }); // Consider different error codes
  }
}
