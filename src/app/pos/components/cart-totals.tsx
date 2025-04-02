"use client";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Gift, Percent } from "lucide-react";
import { MockCustomer } from "../lib/mock-data";
import useCart from "../lib/use-cart";

interface CartTotalsProps {
  cart: ReturnType<typeof useCart>;
  customer: MockCustomer;
}

const POINTS_TO_KES_RATE = 100;

export default function CartTotals({ cart, customer }: CartTotalsProps) {
  const availableLoyaltyPoints = customer?.loyalty_points ?? 0;
  const isWalkIn = customer.id === 1;

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= availableLoyaltyPoints) {
      cart.setPointsToRedeem(value);
    } else if (e.target.value === "") {
      cart.setPointsToRedeem(0);
    }
  };

  return (
    <div className="w-full space-y-4">
      {!isWalkIn && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gift className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">
                Loyalty Points:
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-800">
              {availableLoyaltyPoints}
            </span>
          </div>

          {availableLoyaltyPoints > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Percent className="h-4 w-4 text-green-500" />
                <label htmlFor="redeemPoints" className="text-sm text-gray-700">
                  Redeem Points:
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  id="redeemPoints"
                  type="number"
                  min="0"
                  max={availableLoyaltyPoints}
                  className="w-24 text-right rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  value={
                    cart.pointsToRedeem > 0
                      ? cart.pointsToRedeem.toString()
                      : ""
                  }
                  onChange={handlePointsChange}
                />
                <span className="text-sm text-gray-600">
                  (- KES {(cart.pointsToRedeem / POINTS_TO_KES_RATE).toFixed(2)}
                  )
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="w-full space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-700">Subtotal</span>
          <span className="font-semibold text-gray-800">
            KES {cart.subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Tax (8%)</span>
          <span className="font-semibold">KES {cart.taxAmount.toFixed(2)}</span>
        </div>

        {cart.redeemedAmount > 0 && (
          <div className="flex justify-between text-green-600 font-semibold">
            <span>Loyalty Discount</span>
            <span>- KES {cart.redeemedAmount.toFixed(2)}</span>
          </div>
        )}

        <Separator className="my-2" />

        <div className="flex justify-between font-semibold text-lg text-gray-900">
          <span>Total</span>
          <span>KES {cart.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
