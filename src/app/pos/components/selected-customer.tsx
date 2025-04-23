"use client";

import { X } from "lucide-react";
import { Customer } from "@/lib/types";

interface SelectedCustomerProps {
  customer: Customer;
  loyaltyPointsToRedeem: number;
  onClearCustomer: () => void;
  onPointsRedeemChange: (points: number) => void;
  pointsEarned: number;
}

const SelectedCustomer = ({
  customer,
  loyaltyPointsToRedeem,
  onClearCustomer,
  onPointsRedeemChange,
  pointsEarned,
}: SelectedCustomerProps) => {
  // Calculate loyalty points value for redemption (10 points = $1 discount)
  const calculateLoyaltyPointsValue = () => {
    return parseFloat((loyaltyPointsToRedeem / 10).toFixed(2));
  };

  return (
    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium">{customer.name}</div>
          <div className="text-sm">{customer.phone}</div>
          <div className="text-sm mt-1">
            <span
              className={`px-2 py-0.5 rounded-full text-xs ${
                customer.isLoyalCustomer
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {customer.isLoyalCustomer ? "Loyal Customer" : "Regular Customer"}
            </span>
          </div>
        </div>
        <button
          className="text-red-500 hover:text-red-700"
          onClick={onClearCustomer}
        >
          <X size={16} />
        </button>
      </div>

      {/* Loyalty Points */}
      <div className="mt-2 pt-2 border-t border-blue-200">
        <div className="flex justify-between text-sm">
          <span>Available Points:</span>
          <span className="font-medium">{customer.loyaltyPoints}</span>
        </div>

        {!!customer.loyaltyPoints && (
          <div className="mt-2">
            <label className="text-xs text-gray-600 block mb-1">
              Redeem Points (10 points = $1)
            </label>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max={customer.loyaltyPoints}
                step="10"
                value={loyaltyPointsToRedeem}
                onChange={(e) => onPointsRedeemChange(parseInt(e.target.value))}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="ml-2 text-sm font-medium w-12 text-right">
                {loyaltyPointsToRedeem}
              </span>
            </div>
            {loyaltyPointsToRedeem > 0 && (
              <div className="text-xs text-green-600 mt-1">
                Redeeming {loyaltyPointsToRedeem} points for $
                {calculateLoyaltyPointsValue()} discount
              </div>
            )}
          </div>
        )}

        <div className="mt-2 text-xs text-blue-600">
          This purchase will earn: {pointsEarned} points
        </div>
      </div>
    </div>
  );
};

export default SelectedCustomer;
