"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Gift, Percent } from "lucide-react";

interface LoyaltyPointsProps {
  availablePoints: number;
  pointsToRedeem: number;
  onRedeemChange: (points: number) => void;
  onMaxRedeem: () => void;
  pointsToKesRate: number;
}

export function LoyaltyPoints({
  availablePoints,
  pointsToRedeem,
  onRedeemChange,
  onMaxRedeem,
  pointsToKesRate,
}: LoyaltyPointsProps) {
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= availablePoints) {
      onRedeemChange(value);
    } else if (e.target.value === "") {
      onRedeemChange(0);
    }
  };

  const discountAmount = (pointsToRedeem / pointsToKesRate).toFixed(2);

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Gift className="h-5 w-5 text-yellow-500" />
          <h3 className="font-medium">Loyalty Points</h3>
        </div>
        <span className="font-semibold">{availablePoints} pts</span>
      </div>

      {availablePoints > 0 && (
        <>
          <div className="flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-2 flex-1">
              <Percent className="h-4 w-4 text-green-500" />
              <Input
                type="number"
                min="0"
                max={availablePoints}
                placeholder="Points to redeem"
                className="text-right"
                value={pointsToRedeem > 0 ? pointsToRedeem.toString() : ""}
                onChange={handlePointsChange}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onMaxRedeem}
              className="whitespace-nowrap"
            >
              Use Max
            </Button>
          </div>

          {pointsToRedeem > 0 && (
            <div className="text-right text-sm text-green-600 font-medium">
              Discount: -KES {discountAmount}
            </div>
          )}

          <div className="text-xs text-muted-foreground text-right">
            {pointsToKesRate} pts = 1 KES
          </div>
        </>
      )}
    </div>
  );
}
