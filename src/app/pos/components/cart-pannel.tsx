"use client";

import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import { MockCustomer } from "../lib/mock-data";
import useCart from "../lib/use-cart";
import CartItem from "./cart-item";
import ReceiptDialog from "./receipt";
import CartTotals from "./cart-totals";
import { LoyaltyPoints } from "./loyalty-points";

interface CartPanelProps {
  cart: ReturnType<typeof useCart>;
  customers: MockCustomer[];
  selectedCustomer: MockCustomer;
  onCustomerChange: (customer: MockCustomer) => void;
}

export default function CartPanel({
  cart,
  customers,
  selectedCustomer,
  onCustomerChange,
}: CartPanelProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    setIsCheckoutOpen(true);
  };

  return (
    <div className="w-1/3 flex flex-col bg-gray-50">
      <Card className="flex flex-col h-full shadow-md rounded-none border-l border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6">
          <CardTitle className="text-xl font-semibold flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-gray-600" /> Your Cart
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={cart.clearCart}
            disabled={cart.items.length === 0}
            className="text-red-500 hover:bg-red-500/10"
          >
            <X className="h-4 w-4 mr-1" /> Clear Cart
          </Button>
        </CardHeader>

        <Separator />

        <ScrollArea className="flex-grow p-6">
          {cart.items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Cart is empty. Add products to start a sale.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {cart.items.map((item) => (
                <CartItem
                  key={item.productId}
                  item={item}
                  onUpdateQuantity={cart.updateQuantity}
                  onRemoveItem={cart.removeItem}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <CardFooter className="p-6 flex flex-col space-y-4 bg-gray-100">
          {/* Loyalty points section */}

          <LoyaltyPoints
            availablePoints={cart.availableLoyaltyPoints}
            pointsToRedeem={cart.pointsToRedeem}
            onRedeemChange={cart.setPointsToRedeem}
            onMaxRedeem={cart.redeemMaxPoints}
            pointsToKesRate={cart.pointsToKesRate}
          />
          <CartTotals cart={cart} customer={selectedCustomer} />
          <Button
            size="lg"
            className="w-full text-lg py-3 rounded-md bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
            disabled={cart.items.length === 0}
            onClick={handleCheckout}
          >
            Checkout
          </Button>
        </CardFooter>
      </Card>

      <ReceiptDialog
        open={isCheckoutOpen}
        onOpenChange={setIsCheckoutOpen}
        cart={cart}
        customer={selectedCustomer}
      />
    </div>
  );
}
