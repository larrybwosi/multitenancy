// app/pos/_components/OrderPanel.tsx
'use client';

import { CartItem, CustomerSearchResult } from '../../types'; // Adjust path
import { Plus, Minus, Trash2, UserX, Search, Users, XCircle, Package } from 'lucide-react';

// Import Shadcn Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { PaymentMethod } from '@prisma/client';

interface OrderPanelProps {
  cart: CartItem[];
  customerSearchQuery: string;
  setCustomerSearchQuery: (query: string) => void;
  customerSearchResults: CustomerSearchResult[];
  selectedCustomer: CustomerSearchResult | null;
  isSearchingCustomers: boolean;
  onSelectCustomer: (customer: CustomerSearchResult) => void;
  onClearCustomer: () => void;
  onQuantityChange: (cartItemId: string, change: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onResetOrder: () => void;
  onProcessSale: (paymentMethod: PaymentMethod) => void;
  isProcessing: boolean;
}

export default function OrderPanel({
  cart,
  customerSearchQuery,
  setCustomerSearchQuery,
  customerSearchResults,
  selectedCustomer,
  isSearchingCustomers,
  onSelectCustomer,
  onClearCustomer,
  onQuantityChange,
  onRemoveItem,
  onResetOrder,
  onProcessSale,
  isProcessing,
}: OrderPanelProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH); // Default payment

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const taxRate = 0.12; // TODO: Make dynamic
  const tax = subtotal * taxRate;
  const discount = 0; // TODO: Implement discount logic
  const total = subtotal - discount + tax;

  const handlePaymentMethodChange = (value: string) => {
      setPaymentMethod(value as PaymentMethod); // Assume value matches enum keys
  };

  const handlePay = () => {
      if (!isProcessing) {
         onProcessSale(paymentMethod);
      }
  }

  const getInitials = (name: string | null | undefined) => {
     return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  }

  return (
    <div className="w-1/3 bg-background border-l flex flex-col h-full">
      {/* Customer Section */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-2">
             <h2 className="text-sm font-semibold flex items-center">
                 <Users className="w-4 h-4 mr-2" /> Customer
             </h2>
             {selectedCustomer && (
                <Button variant="ghost" size="sm" className="text-xs text-red-600 hover:text-red-700" onClick={onClearCustomer}>
                     <UserX className="w-3 h-3 mr-1" /> Clear Customer
                </Button>
             )}
        </div>
        {!selectedCustomer ? (
            <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search customer by name, email, phone..."
                className="pl-8"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                disabled={isProcessing}
            />
            {isSearchingCustomers && <p className="text-xs text-muted-foreground mt-1">Searching...</p>}
            {!isSearchingCustomers && customerSearchQuery.length > 1 && customerSearchResults.length > 0 && (
                <Card className="absolute z-10 w-full mt-1 shadow-lg max-h-48 overflow-y-auto">
                    <CardContent className="p-2">
                        {customerSearchResults.map(cust => (
                        <div key={cust.id}
                            className="flex items-center p-2 hover:bg-muted rounded cursor-pointer"
                            onClick={() => onSelectCustomer(cust)}>
                            <Avatar className="h-6 w-6 mr-2">
                                {/* <AvatarImage src={cust.avatarUrl} /> */}
                                <AvatarFallback className="text-xs">{getInitials(cust.name)}</AvatarFallback>
                            </Avatar>
                            <div className="text-xs">
                                <p className="font-medium">{cust.name}</p>
                                <p className="text-muted-foreground">{cust.email}</p>
                            </div>
                            <Badge variant="outline" className="ml-auto text-xs">{cust.loyaltyPoints} pts</Badge>
                        </div>
                        ))}
                    </CardContent>
                </Card>
            )}
             {!isSearchingCustomers && customerSearchQuery.length > 1 && customerSearchResults.length === 0 && (
                 <p className="text-xs text-muted-foreground mt-1">No customers found.</p>
             )}
            </div>
        ) : (
            <Card>
                <CardContent className="p-3 flex items-center">
                     <Avatar className="h-8 w-8 mr-3">
                         {/* <AvatarImage src={selectedCustomer.avatarUrl} /> */}
                         <AvatarFallback>{getInitials(selectedCustomer.name)}</AvatarFallback>
                     </Avatar>
                     <div className="text-sm">
                         <p className="font-medium">{selectedCustomer.name}</p>
                         <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                     </div>
                     <Badge variant="secondary" className="ml-auto">{selectedCustomer.loyaltyPoints} pts</Badge>
                </CardContent>
            </Card>
        )}
      </div>

      {/* Cart Items List */}
      <ScrollArea className="flex-1">
         <div className="p-4 space-y-3">
            {cart.length === 0 && (
                <p className="text-muted-foreground text-center py-8">Cart is empty.</p>
            )}
            {cart.map((item) => (
            <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-2 flex items-center space-x-3">
                    <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                        {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package className="w-6 h-6 text-muted-foreground" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={item.name}>{item.name}</p>
                        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center space-x-1 text-sm">
                        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => onQuantityChange(item.id, -1)} disabled={isProcessing}>
                            <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-medium w-5 text-center">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => onQuantityChange(item.id, 1)} disabled={isProcessing}>
                            <Plus className="w-4 h-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="w-6 h-6 text-red-500 hover:text-red-600" onClick={() => onRemoveItem(item.id)} disabled={isProcessing}>
                            <XCircle className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
            ))}
         </div>
      </ScrollArea>

      {/* Order Summary & Actions */}
      <div className="p-4 border-t bg-muted/40">
        <div className="space-y-1 text-sm mb-4">
             <div className="flex justify-between">
               <span className="text-muted-foreground">Sub Total</span>
               <span>${subtotal.toFixed(2)}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-muted-foreground">Discount</span>
               {/* TODO: Add discount button/display */}
               <span className="text-green-600">-${discount.toFixed(2)}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-muted-foreground">Tax ({ (taxRate * 100).toFixed(0) }%)</span>
               <span>${tax.toFixed(2)}</span>
             </div>
             <Separator className="my-2" />
             <div className="flex justify-between font-semibold text-lg">
               <span>Total</span>
               <span>${total.toFixed(2)}</span>
             </div>
        </div>

        {/* Payment Method & Actions */}
        <div className="flex gap-2 mb-3">
            <Select value={paymentMethod} onValueChange={handlePaymentMethodChange} disabled={isProcessing || cart.length === 0}>
                <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                    {/* Get options from PaymentMethod enum */}
                    {Object.values(PaymentMethod).map(method => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
             <Button variant="outline" onClick={onResetOrder} disabled={isProcessing || cart.length === 0} title="Reset Order">
                <Trash2 className="w-4 h-4"/>
            </Button>
        </div>

        <Button
            size="lg"
            className="w-full font-semibold"
            onClick={handlePay}
            disabled={isProcessing || cart.length === 0}
        >
          {isProcessing ? 'Processing...' : `Pay ${paymentMethod} $${total.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}