import Pusher from 'pusher-js';

// Initialize Pusher client
const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
});

interface InitiateMpesaPaymentParams {
  phoneNumber: string;
  amount: number;
  orderId: string;
}

interface MpesaResponse {
  success: boolean;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  customerMessage?: string;
  message?: string;
}

export function subscribeToPusher(checkoutRequestId: string, callbacks: {
  onSuccess?: () => void;
  onFailed?: (message: string) => void;
}) {
  const channel = pusher.subscribe('mpesa-payments');
  
  channel.bind('payment-status', (data: {
    status: string;
    checkoutRequestId: string;
    responseDescription: string;
    customerMessage: string;
  }) => {
    if (data.checkoutRequestId === checkoutRequestId) {
      if (data.status === 'SUCCESS' && callbacks.onSuccess) {
        callbacks.onSuccess();
      } else if (data.status === 'FAILED' && callbacks.onFailed) {
        callbacks.onFailed(data.customerMessage || data.responseDescription);
      }
    }
  });

  return () => {
    channel.unbind_all();
    pusher.unsubscribe('mpesa-payments');
  };
}

export async function initiateMpesaPayment({
  phoneNumber,
  amount,
  orderId,
}: InitiateMpesaPaymentParams): Promise<MpesaResponse> {
  try {
    const response = await fetch('/api/mpesa/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        amount,
        orderId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to initiate payment');
    }

    return data;
  } catch (error) {
    console.error('Error initiating M-Pesa payment:', error);
    throw error;
  }
}
