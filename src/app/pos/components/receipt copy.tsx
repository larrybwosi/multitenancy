"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: ReturnType<typeof useCart>;
  customer: MockCustomer;
}

const DEFAULT_TAX_RATE = 8;
const LOYALTY_POINTS_PER_AMOUNT = 10;

export default function ReceiptDialog({
  open,
  onOpenChange,
  cart,
  customer,
}: ReceiptDialogProps) {
  const pointsEarned = Math.floor(cart.subtotal / LOYALTY_POINTS_PER_AMOUNT);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
            Receipt
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 text-center">
            {format(new Date(), "yyyy-MM-dd HH:mm:ss")}
          </p>
          {customer.name !== "Walk-in Customer" && (
            <p className="text-sm text-gray-600">
              Customer: {customer.name} (ID: {customer.id})
            </p>
          )}

          <Separator className="my-2" />

          <ul className="space-y-2">
            {cart.items.map((item) => (
              <li key={item.name} className="flex justify-between text-sm">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>KES {(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <Separator className="my-2" />

          <div className="flex justify-between font-semibold text-sm">
            <span>Subtotal:</span>
            <span>KES {cart.subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax ({DEFAULT_TAX_RATE}%):</span>
            <span>KES {cart.taxAmount.toFixed(2)}</span>
          </div>

          {cart.redeemedAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-semibold">
              <span>Loyalty Discount:</span>
              <span>- KES {cart.redeemedAmount.toFixed(2)}</span>
            </div>
          )}

          <Separator className="my-2" />

          <div className="flex justify-between font-bold text-md">
            <span>Total:</span>
            <span>KES {cart.total.toFixed(2)}</span>
          </div>

          {pointsEarned > 0 && (
            <p className="text-xs text-green-500 mt-2">
              Earned {pointsEarned} loyalty points!
            </p>
          )}

          {cart.pointsToRedeem > 0 && (
            <p className="text-xs text-yellow-500 mt-1">
              Redeemed {cart.pointsToRedeem} loyalty points.
            </p>
          )}

          <div className="text-center mt-4">
            <p className="text-sm text-gray-700">
              Thank you for your purchase!
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
