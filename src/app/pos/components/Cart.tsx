"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Trash2,
  DollarSign,
  User,
  UserX,
  CreditCard,
  Printer,
  Percent,
  Phone,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { CartItem } from "./CartItem";
import { CustomerSelectionDialog } from "./CustomerSelectionDialog";
import { formatCurrency, parseFloatSafe } from "@/lib/utils";
import { toast } from "sonner";
import { CartProps, Customer, PaymentMethod, SaleData } from "../types";
import { Receipt } from "./Receipt";
import SelectedCustomer from "./selected-customer";

const TAX_RATE = 0.16; // 16% tax rate
const POINTS_TO_CURRENCY_RATIO = 10; // 10 points = $1

const mapCartItemsToReceiptItems = (items: CartProps['cartItems']) => {
  return items.map(item => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice: parseFloat(item.unitPrice),
    totalPrice: parseFloat(item.totalPrice),
    sku: item.sku
  }));
};

export function Cart({
  cartItems = [],
  cartTotal = "0",
  customers = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitSale,
}: CartProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [notes, setNotes] = useState("");
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);

  // Calculate points earned and discount whenever cart or points change
  useEffect(() => {
    if (selectedCustomer?.isLoyalCustomer) {
      // Calculate points earned (1 point per $1 spent)
      const subtotal = parseFloatSafe(cartTotal);
      const earned = Math.floor(subtotal);
      setPointsEarned(earned);
    } else {
      setPointsEarned(0);
    }
  }, [cartTotal, selectedCustomer]);

  // Auto-fill phone number from customer if available and payment method is MPESA
  useEffect(() => {
    if (paymentMethod === PaymentMethod.MPESA && selectedCustomer?.phone) {
      setPhoneNumber(selectedCustomer.phone);
    }
  }, [paymentMethod, selectedCustomer]);

  const subtotal = parseFloatSafe(cartTotal);
  const loyaltyDiscount = loyaltyPointsToRedeem / POINTS_TO_CURRENCY_RATIO;
  const taxableAmount = subtotal - loyaltyDiscount;
  const taxAmount = taxableAmount * TAX_RATE;
  const totalAmount = taxableAmount + taxAmount;

  const handleCustomerSelect = useCallback((customer: Customer | null) => {
    setSelectedCustomer(customer);
    setLoyaltyPointsToRedeem(0); // Reset points when customer changes
  }, []);

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setLoyaltyPointsToRedeem(0);
  };

  const handlePointsRedeemChange = (points: number) => {
    setLoyaltyPointsToRedeem(points);
  };

  const handleSubmit = async () => {
    if (cartItems.length === 0) {
      toast.error("Cart is empty", { duration: 2000 });
      return;
    }

    // Validate phone number if MPESA payment method
    if (paymentMethod === PaymentMethod.MPESA) {
      if (!phoneNumber) {
        toast.error("Phone number is required for MPESA payments", { duration: 3000 });
        return;
      }
      
      const phoneRegex = /^(?:254|\+254|0)?(7[0-9]{8})$/;
      if (!phoneRegex.test(phoneNumber)) {
        toast.error("Please enter a valid Kenyan phone number", { duration: 3000 });
        return;
      }
      
      setMpesaStatus('pending');
    }
    
    setIsSubmitting(true);

    const saleData: SaleData = {
      customerId: selectedCustomer?.id || null,
      paymentMethod,
      notes,
      items: cartItems.map((item) => ({
        productId: item.id,
        variantId: item.variantId || null,
        quantity: item.quantity,
      })),
      taxAmount: taxAmount.toString(),
      totalAmount: totalAmount.toString(),
      phoneNumber: paymentMethod === PaymentMethod.MPESA ? phoneNumber : undefined,
      loyaltyPointsRedeemed: loyaltyPointsToRedeem,
      loyaltyPointsEarned: pointsEarned,
    };

    try {
      const result = await onSubmitSale(saleData);
      if (result.success) {
        if (paymentMethod === PaymentMethod.MPESA) {
          toast.success("MPESA STK Push sent!", {
            description: "Please check your phone to complete payment",
            duration: 5000,
          });
          setMpesaStatus('success');
          setTimeout(() => {
            onClearCart();
            handleClearCustomer();
            setNotes("");
            setPhoneNumber("");
            setPaymentMethod(PaymentMethod.CASH);
            setIsCheckoutDialogOpen(false);
            setIsReceiptOpen(true);
            setMpesaStatus('idle');
          }, 2000);
        } else {
          toast.success("Sale Successful!", {
            description: result.message,
            duration: 3000,
          });
          onClearCart();
          handleClearCustomer();
          setNotes("");
          setPhoneNumber("");
          setPaymentMethod(PaymentMethod.CASH);
          setIsCheckoutDialogOpen(false);
          setIsReceiptOpen(true);
        }
      } else {
        if (paymentMethod === PaymentMethod.MPESA) {
          setMpesaStatus('failed');
        }
        toast.error("Checkout Failed", {
          description: result.message || "An unknown error occurred.",
          duration: 5000,
        });
      }
    } catch (error: unknown) {
      if (paymentMethod === PaymentMethod.MPESA) {
        setMpesaStatus('failed');
      }
      console.error("Error processing sale:", error);
      toast.error("Checkout Failed", {
        description: "An unexpected error occurred.",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerTriggerButton = (
    <Button
      variant={selectedCustomer ? "secondary" : "outline"}
      size="sm"
      className="w-full justify-start text-left hover:bg-blue-50/50 transition-colors border border-gray-200 hover:border-blue-200 rounded-lg"
    >
      {selectedCustomer ? (
        <>
          <div className="flex items-center w-full">
            <div className="bg-blue-100 p-1.5 rounded-full mr-3">
              <User className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <span className="truncate flex-grow text-sm font-medium text-gray-800">
              {selectedCustomer.name}
            </span>
            <button
              className="ml-2 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                handleClearCustomer();
              }}
            >
              <UserX className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center w-full">
            <div className="bg-gray-100 p-1.5 rounded-full mr-3">
              <User className="h-3.5 w-3.5 text-gray-500" />
            </div>
            <span className="text-sm text-gray-600">Add Customer</span>
          </div>
        </>
      )}
    </Button>
  );

  return (
    <>
      <Card className="flex flex-col h-full w-full border border-gray-100 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardHeader className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-3 text-gray-900 font-semibold">
              <div className="bg-blue-600 p-2 rounded-lg">
                <ShoppingCart size={18} className="text-white" />
              </div>
              <span>Current Sale</span>
            </CardTitle>
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearCart}
                className="text-gray-500 hover:text-red-500 hover:bg-red-50 h-8 w-8 rounded-lg"
                aria-label="Clear Cart"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
          <div className="mt-4">
            <CustomerSelectionDialog
              customers={customers}
              selectedCustomer={selectedCustomer}
              onCustomerSelect={handleCustomerSelect}
              triggerButton={customerTriggerButton}
            />
          </div>
          {selectedCustomer && (
            <div className="mt-3">
              <SelectedCustomer
                customer={selectedCustomer}
                loyaltyPointsToRedeem={loyaltyPointsToRedeem}
                onClearCustomer={handleClearCustomer}
                onPointsRedeemChange={handlePointsRedeemChange}
                pointsEarned={pointsEarned}
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-hidden">
          <ScrollArea className="h-full">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4 shadow-inner">
                  <ShoppingCart size={28} className="text-blue-400 opacity-60" />
                </div>
                <p className="text-gray-700 font-medium text-sm">Your cart is empty</p>
                <p className="text-xs text-gray-400 mt-1">
                  Start by adding products from the inventory
                </p>
              </div>
            ) : (
              <Table className="text-sm">
                <TableBody>
                  {cartItems.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={onUpdateQuantity}
                      onRemoveItem={onRemoveItem}
                    />
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
        {cartItems.length > 0 && (
          <CardFooter className="p-5 flex flex-col gap-3 border-t border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">
            {loyaltyDiscount > 0 && (
              <div className="w-full flex justify-between items-center text-green-600">
                <span className="text-sm">Loyalty Discount</span>
                <span className="font-medium">-{formatCurrency(loyaltyDiscount)}</span>
              </div>
            )}

            <div className="w-full flex justify-between items-center">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-800">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="w-full flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="bg-gray-100 p-1 rounded">
                  <Percent size={12} className="text-gray-400" />
                </div>
                <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
              </div>
              <span className="font-medium text-gray-800">
                {formatCurrency(taxAmount)}
              </span>
            </div>

            <Separator className="my-1 bg-gray-200" />

            <div className="w-full flex justify-between items-center text-base">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-blue-600">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <Dialog
              open={isCheckoutDialogOpen}
              onOpenChange={setIsCheckoutDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="w-full mt-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-lg h-12"
                  disabled={isSubmitting || cartItems.length === 0}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  {isSubmitting
                    ? "Processing..."
                    : `Pay ${formatCurrency(totalAmount)}`}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-xl">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-gray-900 text-lg">
                        Complete Sale
                      </DialogTitle>
                      <p className="text-gray-500 text-xs">
                        Confirm payment details for {formatCurrency(totalAmount)}
                      </p>
                    </div>
                  </div>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {loyaltyDiscount > 0 && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <div className="flex justify-between text-sm text-green-700">
                        <span>Loyalty Discount Applied:</span>
                        <span className="font-medium">-{formatCurrency(loyaltyDiscount)}</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="payment-method"
                      className="text-right text-sm text-gray-600"
                    >
                      Payment
                    </Label>
                    <Select
                      onValueChange={(value: PaymentMethod) =>
                        setPaymentMethod(value)
                      }
                      defaultValue={paymentMethod}
                      value={paymentMethod}
                    >
                      <SelectTrigger id="payment-method" className="col-span-3 rounded-lg">
                        <SelectValue placeholder="Select Method" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {Object.values(PaymentMethod).map((method) => (
                          <SelectItem 
                            key={method} 
                            value={method}
                            className="rounded-md"
                          >
                            {method.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {paymentMethod === PaymentMethod.MPESA && (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label
                        htmlFor="phone-number"
                        className="text-right text-sm text-gray-600"
                      >
                        M-Pesa
                      </Label>
                      <div className="col-span-3 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-gray-400" />
                        </div>
                        <Input
                          id="phone-number"
                          placeholder="Enter phone number (e.g., 0712345678)"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="pl-10 rounded-lg"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label
                      htmlFor="notes"
                      className="text-right text-sm text-gray-600 pt-2"
                    >
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="col-span-3 min-h-[80px] rounded-lg"
                      placeholder="Optional sale notes..."
                    />
                  </div>

                  <div className="space-y-2 pt-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal:</span>
                      <span className="text-gray-800">{formatCurrency(subtotal)}</span>
                    </div>
                    {loyaltyDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Loyalty Discount:</span>
                        <span>-{formatCurrency(loyaltyDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Tax ({(TAX_RATE * 100).toFixed(0)}%):
                      </span>
                      <span className="text-gray-800">{formatCurrency(taxAmount)}</span>
                    </div>
                    <Separator className="my-2 bg-gray-200" />
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-blue-600">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>

                  {selectedCustomer && (
                    <div className="text-center text-xs text-gray-500 border-t pt-3 mt-1">
                      Sale linked to:{" "}
                      <span className="font-medium text-gray-900">
                        {selectedCustomer.name}
                      </span>
                    </div>
                  )}
                  
                  {mpesaStatus === 'pending' && (
                    <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <Loader2 className="animate-spin h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-blue-700 text-xs">Sending M-Pesa request...</span>
                    </div>
                  )}
                  
                  {mpesaStatus === 'success' && (
                    <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg border border-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-green-700 text-xs">M-Pesa request sent successfully!</span>
                    </div>
                  )}
                  
                  {mpesaStatus === 'failed' && (
                    <div className="flex items-center justify-center p-3 bg-red-50 rounded-lg border border-red-100">
                      <XCircle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-red-700 text-xs">M-Pesa request failed. Please try again.</span>
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2">
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      className="text-gray-700 rounded-lg border-gray-300"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white transition-colors rounded-lg shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <DollarSign className="mr-2 h-4 w-4" />
                        Confirm Sale
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        )}
      </Card>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Printer className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-gray-900 text-lg">
                  Sale Receipt
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <Receipt
            items={mapCartItemsToReceiptItems(cartItems)}
            subtotal={subtotal}
            taxAmount={taxAmount}
            total={totalAmount}
            paymentMethod={paymentMethod}
            customer={selectedCustomer}
            date={new Date()}
            loyaltyDiscount={loyaltyDiscount}
            pointsEarned={pointsEarned}
          />
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              onClick={() => setIsReceiptOpen(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}