// components/pos/Cart.jsx
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

const TAX_RATE = 0.16; // 16% tax rate

// Convert CartItems to Receipt compatible format
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
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [notes, setNotes] = useState("");
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mpesaStatus, setMpesaStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');

  // Auto-fill phone number from customer if available and payment method is MPESA
  useEffect(() => {
    if (paymentMethod === PaymentMethod.MPESA && selectedCustomer?.phone) {
      setPhoneNumber(selectedCustomer.phone);
    }
  }, [paymentMethod, selectedCustomer]);

  const subtotal = parseFloatSafe(cartTotal);
  const taxAmount = subtotal * TAX_RATE;
  const totalAmount = subtotal + taxAmount;

  const handleCustomerSelect = useCallback((customer: Customer | null) => {
    setSelectedCustomer(customer);
  }, []);

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
      
      // Basic phone number validation
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
          // Wait for a moment before proceeding to make sure user sees the success message
          setTimeout(() => {
            onClearCart();
            setSelectedCustomer(null);
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
          setSelectedCustomer(null);
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
      className="w-full justify-start text-left shadow-sm hover:bg-blue-50 transition-colors"
    >
      {selectedCustomer ? (
        <>
          <User className="mr-2 h-4 w-4 text-blue-600" />
          <span className="truncate flex-grow">{selectedCustomer.name}</span>
          <UserX
            className="ml-2 h-4 w-4 text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              handleCustomerSelect(null);
            }}
          />
        </>
      ) : (
        <>
          <User className="mr-2 h-4 w-4 text-gray-400" />
          Add Customer
        </>
      )}
    </Button>
  );

  return (
    <>
      <Card className="flex flex-col h-full w-full border-l border-gray-200 shadow-md rounded-lg overflow-hidden bg-white">
        <CardHeader className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-900 font-semibold">
              <ShoppingCart size={20} className="text-blue-600" />
              <span>Current Sale</span>
            </CardTitle>
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearCart}
                className="text-red-500 hover:bg-red-50 h-8 w-8 rounded-full"
                aria-label="Clear Cart"
              >
                <Trash2 size={18} />
              </Button>
            )}
          </div>
          <div className="mt-3">
            <CustomerSelectionDialog
              customers={customers}
              selectedCustomer={selectedCustomer}
              onCustomerSelect={handleCustomerSelect}
              triggerButton={customerTriggerButton}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-hidden">
          <ScrollArea className="h-full">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-6">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <ShoppingCart size={30} className="text-blue-300" />
                </div>
                <p className="text-gray-600 font-medium">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add products from the list
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
          <CardFooter className="p-4 flex flex-col gap-3 border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white">
            <div className="w-full flex justify-between items-center">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <div className="w-full flex justify-between items-center">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Percent size={14} className="text-gray-400" />
                <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
              </div>
              <span className="font-medium text-gray-900">
                {formatCurrency(taxAmount)}
              </span>
            </div>

            <Separator className="my-1 bg-gray-200" />

            <div className="w-full flex justify-between items-center text-lg">
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
                  className="w-full mt-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md transition-all"
                  disabled={isSubmitting || cartItems.length === 0}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  {isSubmitting
                    ? "Processing..."
                    : `Pay ${formatCurrency(totalAmount)}`}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-lg">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 text-xl">
                    Complete Sale
                  </DialogTitle>
                  <p className="text-gray-500 text-sm pt-1">
                    Confirm payment details for {formatCurrency(totalAmount)}.
                  </p>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="payment-method"
                      className="text-right text-sm text-gray-700"
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
                      <SelectTrigger id="payment-method" className="col-span-3">
                        <SelectValue placeholder="Select Method" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PaymentMethod).map((method) => (
                          <SelectItem key={method} value={method}>
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
                        className="text-right text-sm text-gray-700"
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
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label
                      htmlFor="notes"
                      className="text-right text-sm text-gray-700 pt-2"
                    >
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="col-span-3 min-h-[60px]"
                      placeholder="Optional sale notes..."
                    />
                  </div>

                  <div className="space-y-2 pt-2 bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Tax ({(TAX_RATE * 100).toFixed(0)}%):
                      </span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span className="text-blue-600">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                  </div>

                  {selectedCustomer && (
                    <div className="text-center text-sm text-gray-500 border-t pt-4 mt-2">
                      Sale linked to:{" "}
                      <span className="font-medium text-gray-900">
                        {selectedCustomer.name}
                      </span>
                    </div>
                  )}
                  
                  {mpesaStatus === 'pending' && (
                    <div className="flex items-center justify-center p-2 bg-blue-50 rounded-md">
                      <Loader2 className="animate-spin h-5 w-5 text-blue-600 mr-2" />
                      <span className="text-blue-700 text-sm">Sending M-Pesa request...</span>
                    </div>
                  )}
                  
                  {mpesaStatus === 'success' && (
                    <div className="flex items-center justify-center p-2 bg-green-50 rounded-md">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="text-green-700 text-sm">M-Pesa request sent successfully!</span>
                    </div>
                  )}
                  
                  {mpesaStatus === 'failed' && (
                    <div className="flex items-center justify-center p-2 bg-red-50 rounded-md">
                      <XCircle className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-red-700 text-sm">M-Pesa request failed. Please try again.</span>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      className="text-gray-700"
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white transition-colors"
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
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-blue-600" />
              <span>Sale Receipt</span>
            </DialogTitle>
          </DialogHeader>
          <Receipt
            items={mapCartItemsToReceiptItems(cartItems)}
            subtotal={subtotal}
            taxAmount={taxAmount}
            total={totalAmount}
            paymentMethod={paymentMethod}
            customer={selectedCustomer}
            date={new Date()}
          />
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              onClick={() => setIsReceiptOpen(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
