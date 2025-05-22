'use client';
import React, { useState, useEffect } from 'react';
import { Trash2, CreditCard, DollarSign, Smartphone, Plus, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// TypeScript interfaces (matching ProductGrid structure)
interface Variant {
  id: string;
  name: string;
  retailPrice: number;
  wholesalePrice: number;
}

interface CartItem {
  id: string;
  name: string;
  selectedVariant: Variant;
  retailPrice: number;
  priceMode: 'wholesale' | 'retail';
  quantity: number;
}

interface Customer {
  id: string;
  name: string;
}

interface CartComponentProps {
  cartItems: CartItem[];
  cartTotal: string;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onSubmitSale: () => void;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  customers: Customer[];
  isLoadingCustomers: boolean;
}

const CartComponent: React.FC<CartComponentProps> = ({
  cartItems,
  cartTotal,
  onRemoveItem,
  onClearCart,
  onSubmitSale,
  onUpdateQuantity,
  customers,
  isLoadingCustomers,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'mobile' | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    cashAmount: '',
    mobileNumber: '',
    mobileProvider: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset payment details when payment method changes
  useEffect(() => {
    setPaymentDetails({
      cardNumber: '',
      cardExpiry: '',
      cardCVC: '',
      cashAmount: '',
      mobileNumber: '',
      mobileProvider: '',
    });
    setErrors({});
  }, [paymentMethod]);

  const validatePaymentDetails = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    if (paymentMethod === 'card') {
      if (!paymentDetails.cardNumber || !/^\d{16}$/.test(paymentDetails.cardNumber)) {
        newErrors.cardNumber = 'Enter a valid 16-digit card number';
      }
      if (!paymentDetails.cardExpiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(paymentDetails.cardExpiry)) {
        newErrors.cardExpiry = 'Enter a valid expiry date (MM/YY)';
      }
      if (!paymentDetails.cardCVC || !/^\d{3,4}$/.test(paymentDetails.cardCVC)) {
        newErrors.cardCVC = 'Enter a valid CVC';
      }
    }

    if (paymentMethod === 'cash') {
      const cash = parseFloat(paymentDetails.cashAmount);
      const total = parseFloat(cartTotal);
      if (!paymentDetails.cashAmount || isNaN(cash) || cash < total) {
        newErrors.cashAmount = `Enter an amount at least $${cartTotal}`;
      }
    }

    if (paymentMethod === 'mobile') {
      if (!paymentDetails.mobileNumber || !/^\+?\d{10,12}$/.test(paymentDetails.mobileNumber)) {
        newErrors.mobileNumber = 'Enter a valid mobile number';
      }
      if (!paymentDetails.mobileProvider) {
        newErrors.mobileProvider = 'Select a mobile provider';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePaymentSubmit = async () => {
    if (!validatePaymentDetails()) return;

    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSubmitSale();
      onClearCart();
      setPaymentMethod(null);
      setSelectedCustomer(null);
    } catch (error) {
      console.log('Payment processing error:', error);
      setErrors({ general: 'Payment processing failed. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <Card className="h-full bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Cart</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Selection */}
        <div className="space-y-2">
          <Label htmlFor="customer">Customer</Label>
          <Select
            value={selectedCustomer || undefined}
            onValueChange={setSelectedCustomer}
            disabled={isLoadingCustomers}
          >
            <SelectTrigger id="customer">
              <SelectValue placeholder={isLoadingCustomers ? 'Loading customers...' : 'Select a customer'} />
            </SelectTrigger>
            <SelectContent>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
              <Link href={`/customers?create=true`} className="text-blue-500 hover:underline">
                <p className="flex items-center gap-1 text-sm "><PlusCircle size={12} className="text-blue-500" /> Add New Customer</p>
              </Link>
            </SelectContent>
          </Select>
        </div>

        {/* Cart Items */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {cartItems.length === 0 ? (
            <p className="text-gray-500 text-center">Cart is empty</p>
          ) : (
            cartItems?.map(item => (
              <div key={item.id} className="flex items-center justify-between border-b py-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.selectedVariant.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item?.retailPrice?.toString() || '0')} x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                    className="w-16 h-8 text-center"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Total */}
        <div className="flex justify-between items-center border-t pt-2">
          <span className="text-lg font-semibold text-gray-900">Total:</span>
          <span className="text-lg font-bold text-gray-900">{cartTotal}</span>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-2">
          <Label>Payment Method</Label>
          <div className="flex space-x-2">
            <Button
              variant={paymentMethod === 'card' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('card')}
              className="flex-1"
            >
              <CreditCard size={16} className="mr-2" />
              Card
            </Button>
            <Button
              variant={paymentMethod === 'cash' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('cash')}
              className="flex-1"
            >
              <DollarSign size={16} className="mr-2" />
              Cash
            </Button>
            <Button
              variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
              onClick={() => setPaymentMethod('mobile')}
              className="flex-1"
            >
              <Smartphone size={16} className="mr-2" />
              Mobile
            </Button>
          </div>
          {errors.paymentMethod && <p className="text-red-500 text-xs">{errors.paymentMethod}</p>}
        </div>

        {/* Payment Details */}
        {paymentMethod === 'card' && (
          <div className="space-y-2">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={paymentDetails.cardNumber}
                onChange={e => handleInputChange('cardNumber', e.target.value)}
                placeholder="1234 5678 9012 3456"
              />
              {errors.cardNumber && <p className="text-red-500 text-xs">{errors.cardNumber}</p>}
            </div>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="cardExpiry">Expiry</Label>
                <Input
                  id="cardExpiry"
                  value={paymentDetails.cardExpiry}
                  onChange={e => handleInputChange('cardExpiry', e.target.value)}
                  placeholder="MM/YY"
                />
                {errors.cardExpiry && <p className="text-red-500 text-xs">{errors.cardExpiry}</p>}
              </div>
              <div className="flex-1">
                <Label htmlFor="cardCVC">CVC</Label>
                <Input
                  id="cardCVC"
                  value={paymentDetails.cardCVC}
                  onChange={e => handleInputChange('cardCVC', e.target.value)}
                  placeholder="123"
                />
                {errors.cardCVC && <p className="text-red-500 text-xs">{errors.cardCVC}</p>}
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'cash' && (
          <div className="space-y-2">
            <Label htmlFor="cashAmount">Amount Tendered</Label>
            <Input
              id="cashAmount"
              type="number"
              step="0.01"
              value={paymentDetails.cashAmount}
              onChange={e => handleInputChange('cashAmount', e.target.value)}
              placeholder={`Enter amount (min $${cartTotal})`}
            />
            {errors.cashAmount && <p className="text-red-500 text-xs">{errors.cashAmount}</p>}
          </div>
        )}

        {paymentMethod === 'mobile' && (
          <div className="space-y-2">
            <div>
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input
                id="mobileNumber"
                value={paymentDetails.mobileNumber}
                onChange={e => handleInputChange('mobileNumber', e.target.value)}
                placeholder="+1234567890"
              />
              {errors.mobileNumber && <p className="text-red-500 text-xs">{errors.mobileNumber}</p>}
            </div>
            <div>
              <Label htmlFor="mobileProvider">Mobile Provider</Label>
              <Select
                value={paymentDetails.mobileProvider}
                onValueChange={value => handleInputChange('mobileProvider', value)}
              >
                <SelectTrigger id="mobileProvider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="airtel">Airtel Money</SelectItem>
                  <SelectItem value="tigo">Tigo Pesa</SelectItem>
                </SelectContent>
              </Select>
              {errors.mobileProvider && <p className="text-red-500 text-xs">{errors.mobileProvider}</p>}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errors.general && <p className="text-red-500 text-xs text-center">{errors.general}</p>}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={handlePaymentSubmit}
            disabled={cartItems.length === 0 || isProcessing}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {isProcessing ? 'Processing...' : 'Complete Sale'}
          </Button>
          <Button variant="outline" onClick={onClearCart} disabled={cartItems.length === 0} className="w-full">
            Clear Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartComponent;
