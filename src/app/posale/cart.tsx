'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Trash2,
  CreditCard,
  DollarSign,
  Smartphone,
  Plus,
  Minus,
  CheckCircle,
  Download,
  Printer,
  X,
  UserPlus,
  ChevronsUpDown,
} from 'lucide-react';
import { initiateMpesaPayment, subscribeToPusher } from '@/lib/mpesa-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import { useSubmitSale } from '@/hooks/use-sales';
import { useAppStore } from '@/store/app';

// --- Interfaces ---
interface Variant {
  id: string;
  name: string;
  retailPrice: number;
  wholesalePrice: number;
}

interface CartItem {
  id: string;
  variantId: string;
  name: string;
  selectedVariant: Variant;
  retailPrice: number;
  priceMode: 'wholesale' | 'retail';
  quantity: number;
}

interface Customer {
  id: string;
  name: string;
  phoneNumber?: string; // Added optional phone number
}

interface GroupedCartItem extends CartItem {
  uniqueKey: string;
}

interface CartComponentProps {
  cartItems: CartItem[];
  onRemoveItem: (uniqueKey: string) => void;
  onClearCart: () => void;
  onUpdateQuantity: (uniqueKey: string, newQuantity: number) => void;
  customers: Customer[];
  isLoadingCustomers: boolean;
  onBarcodeScan: (barcode: string) => void; // New prop for barcode handling
}

// --- Success Modal Component (Unchanged) ---
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
  receiptBlob: Blob | null;
  onDownload: () => void;
  onPrint: () => void;
  changeDue?: number; // Optional change due info
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  saleId,
  receiptBlob,
  onDownload,
  onPrint,
  changeDue,
}) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-lg shadow-2xl p-8">
        <DialogHeader className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <DialogTitle className="text-2xl font-bold text-gray-900">Sale Successful!</DialogTitle>
          <DialogDescription className="mt-2 text-gray-600">
            Your sale (ID: {saleId}) has been processed.
            {changeDue && changeDue > 0 && (
              <p className="font-bold text-lg mt-2">Change Due: {formatCurrency(changeDue.toString())}</p>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="my-6 border-t border-b py-4">
          <p className="text-gray-700">Your receipt is ready. You can download or print it now.</p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            onClick={onDownload}
            disabled={!receiptBlob}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
          <Button onClick={onPrint} disabled={!receiptBlob} variant="outline" className="flex-1">
            <Printer className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </DialogFooter>
        <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

// --- Main Cart Component ---
const CartComponent: React.FC<CartComponentProps> = ({
  cartItems,
  onRemoveItem,
  onClearCart,
  onUpdateQuantity,
  customers,
  isLoadingCustomers,
  onBarcodeScan, // Use the new prop
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'mobile' | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    cashAmount: '',
    mobileNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string>('');
  const [currentSaleId, setCurrentSaleId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [receiptBlob, setReceiptBlob] = useState<Blob | null>(null);
  const [changeDue, setChangeDue] = useState<number | undefined>(undefined);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { mutateAsync: submitSale, isLoading: processingSale } = useSubmitSale();
  const warehouse = useAppStore(state => state.currentWarehouse);

  // --- Group Cart Items (Unchanged) ---
  const groupedCartItems = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => {
        const uniqueKey = `${item.id}-${item.selectedVariant.id}`;
        if (acc[uniqueKey]) {
          acc[uniqueKey].quantity += item.quantity;
        } else {
          acc[uniqueKey] = { ...item, uniqueKey };
        }
        return acc;
      },
      {} as Record<string, GroupedCartItem>
    );
  }, [cartItems]);

  const groupedCartArray = Object.values(groupedCartItems);

  // --- Calculate Totals (Unchanged) ---
  const cartTotal = useMemo(
    () => groupedCartArray.reduce((total, item) => total + item.retailPrice * item.quantity, 0),
    [groupedCartArray]
  );

  const VAT_RATE = 0.16;
  const vatAmount = cartTotal * VAT_RATE;
  const totalWithVAT = cartTotal + vatAmount;

  // --- Reset payment details when payment method changes ---
  useEffect(() => {
    setPaymentDetails({
      cardNumber: '',
      cardExpiry: '',
      cardCVC: '',
      cashAmount: '',
      mobileNumber: paymentDetails.mobileNumber, // Keep mobile number if switching back
    });
    setErrors({});
  }, [paymentMethod]);

  // --- Barcode Scanner Listener ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input/textarea, unless it's the specific barcode input (if you add one)
      const target = event.target as HTMLElement;
      if (
        target &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) &&
        !target.classList.contains('barcode-input')
      ) {
        // If you add a dedicated input with class 'barcode-input', allow it.
        // Otherwise, prevent listening when other inputs are focused.
        return;
      }

      // Clear previous timer
      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current);
      }

      if (event.key === 'Enter') {
        if (barcodeInput.length > 3) {
          // Only process if it looks like a barcode
          event.preventDefault();
          console.log('Barcode Scanned:', barcodeInput);
          onBarcodeScan(barcodeInput);
          setBarcodeInput('');
        }
      } else if (event.key.length === 1) {
        // Append alphanumeric keys
        event.preventDefault(); // Prevent default action if needed
        setBarcodeInput(prev => prev + event.key);
      }

      // Set a timer to clear the input if no new key is pressed soon
      barcodeTimerRef.current = setTimeout(() => {
        setBarcodeInput('');
      }, 500); // Adjust timeout (e.g., 500ms)
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (barcodeTimerRef.current) {
        clearTimeout(barcodeTimerRef.current);
      }
    };
  }, [barcodeInput, onBarcodeScan]);

  // --- Pusher Subscription (Unchanged, but needs saleId) ---
  useEffect(() => {
    if (!checkoutRequestId || !currentSaleId) return;

    const saleIdForSubscription = currentSaleId;

    const unsubscribe = subscribeToPusher(checkoutRequestId, {
      onSuccess: async () => {
        setIsProcessing(false);
        toast.success('Payment successful', {
          description: 'Your M-Pesa payment has been processed successfully',
        });
        await handleFetchReceipt(saleIdForSubscription);
        setShowSuccessModal(true);
        // Clear state AFTER showing modal and fetching receipt
        onClearCart();
        setPaymentMethod(null);
        setSelectedCustomer(null);
        setPaymentDetails({ cardNumber: '', cardExpiry: '', cardCVC: '', cashAmount: '', mobileNumber: '' });
        setCurrentSaleId(null);
        setCheckoutRequestId('');
      },
      onFailed: message => {
        setIsProcessing(false);
        setErrors({ mpesa: message });
        toast.error('Payment failed', {
          description: message,
        });
        setCurrentSaleId(null);
        setCheckoutRequestId('');
      },
    });

    return unsubscribe;
  }, [checkoutRequestId, currentSaleId, onClearCart]);

  // --- Fetch Receipt ---
  const handleFetchReceipt = async (saleId: string) => {
    try {
      setReceiptBlob(null); // Reset previous blob
      const response = await fetch(`/api/sales/${saleId}/receipt`);
      
      if (!response.blob) {
        const errorText = await response.text();
        console.error('Receipt fetch failed:', errorText);
        throw new Error('Failed to fetch receipt');
      }
      const blob = await response.blob();
      setReceiptBlob(blob);
    } catch (error) {
      console.error('Error fetching receipt:', error);
      toast.error('Could not fetch receipt', {
        description: 'Please try downloading it later from sales history.',
      });
      setReceiptBlob(null);
    }
  };

  // --- Validate Payment Details ---
  const validatePaymentDetails = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    if (paymentMethod === 'card') {
      if (!paymentDetails.cardNumber || !/^\d{16}$/.test(paymentDetails.cardNumber.replace(/\s/g, ''))) {
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
      if (!paymentDetails.cashAmount || isNaN(cash) || cash < totalWithVAT) {
        newErrors.cashAmount = `Enter an amount of at least ${formatCurrency(totalWithVAT.toString())}`;
      }
    }

    if (paymentMethod === 'mobile') {
      if (!paymentDetails.mobileNumber || !/^\+?\d{10,12}$/.test(paymentDetails.mobileNumber)) {
        newErrors.mobileNumber = 'Enter a valid M-Pesa number (e.g., 2547...)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Clean Up After Sale ---
  const cleanupAfterSale = () => {
    onClearCart();
    setPaymentMethod(null);
    setSelectedCustomer(null);
    setPaymentDetails({ cardNumber: '', cardExpiry: '', cardCVC: '', cashAmount: '', mobileNumber: '' });
    setCurrentSaleId(null);
    setCheckoutRequestId('');
    setChangeDue(undefined);
    setIsProcessing(false);
  };

  // --- Handle Payment Submission ---
  const handlePaymentSubmit = async () => {
    if (!validatePaymentDetails()) return;
    if (!warehouse?.id) {
      toast.error('Warehouse not selected');
      return;
    }
    if (groupedCartArray.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsProcessing(true);
    setErrors({});
    setChangeDue(undefined); // Reset change due

    try {
      // 1. Submit the sale to get a saleId
      const saleResponse = await submitSale({
        customerId: selectedCustomer || undefined,
        cartItems: groupedCartArray.map(item => ({
          productId: item.id,
          variantId: item.selectedVariant.id,
          quantity: item.quantity,
        })),
        paymentMethod: 'CASH', // Ensure it matches Prisma Enum
        locationId: warehouse.id,
        enableStockTracking: true,
      });
      console.log(saleResponse.data?.id)

      if (!saleResponse?.data?.id) {
        throw new Error('Failed to create sale record.');
      }

      const saleId = saleResponse?.data.id;
      setCurrentSaleId(saleId); // Store the saleId

      // 2. Handle Payment Method Specific Logic
      if (paymentMethod === 'mobile') {
        const mpesaResponse = await initiateMpesaPayment({
          phoneNumber: paymentDetails.mobileNumber,
          amount: totalWithVAT,
          orderId: saleId,
        });

        if (mpesaResponse.success && mpesaResponse.checkoutRequestId) {
          setCheckoutRequestId(mpesaResponse.checkoutRequestId);
          toast.info('M-Pesa Payment Initiated', {
            description: 'Please check your phone to enter your PIN.',
          });
          // Wait for Pusher - cleanup happens in Pusher callback
        } else {
          throw new Error(mpesaResponse.message || 'Failed to initiate M-Pesa payment');
        }
      } else {
        // For Cash and Card, payment is considered "instant" in this flow
        await handleFetchReceipt(saleId);

        if (paymentMethod === 'cash') {
          const cash = parseFloat(paymentDetails.cashAmount);
          const change = cash - totalWithVAT;
          setChangeDue(change >= 0 ? change : 0);
          toast.success('Cash Payment Recorded', {
            description: change >= 0 ? `Change Due: ${formatCurrency(change.toString())}` : 'Full amount received.',
          });
        } else if (paymentMethod === 'card') {
          toast.success('Card Payment Recorded', {
            description: 'Sale completed successfully.',
          });
        }

        setShowSuccessModal(true);
        // Don't call cleanup here; modal closing will handle it or a dedicated button
        // For now, let's call cleanup *after* showing modal info
        cleanupAfterSale(); // Or call it when modal closes
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      setErrors({ general: errorMessage });
      toast.error('Payment Failed', {
        description: errorMessage,
        duration: 5000,
      });
      setIsProcessing(false);
      setCurrentSaleId(null);
    }
  };

  // --- Handle Input Change ---
  const handleInputChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' })); // Clear error on change
  };

  // --- Handle Quantity Change (Unchanged) ---
  const handleQuantityChange = (key: string, change: number) => {
    const item = groupedCartItems[key];
    if (!item) return;
    const newQuantity = item.quantity + change;
    if (newQuantity > 0) {
      onUpdateQuantity(key, newQuantity);
    } else {
      onRemoveItem(key);
    }
  };

  // --- Modal Download/Print (Unchanged) ---
  const handleDownloadReceipt = () => {
    if (!receiptBlob) return;
    console.log(currentSaleId)
    const url = URL.createObjectURL(receiptBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt_${currentSaleId || crypto.randomUUID().slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handlePrintReceipt = () => {
    if (!receiptBlob) return;
    const url = URL.createObjectURL(receiptBlob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.src = url;

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        URL.revokeObjectURL(url);
      }, 500);
    };

    document.body.appendChild(iframe);
  };

  // --- Customer Combobox Value ---
  const selectedCustomerName = useMemo(() => {
    if (!selectedCustomer) return 'Select or Walk-in...';
    const customer = customers.find(c => c.id === selectedCustomer);
    return customer ? customer.name : 'Select or Walk-in...';
  }, [selectedCustomer, customers]);

  return (
    <>
      <Card className="h-full bg-white shadow-lg flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-bold text-gray-900">Cart & Checkout</CardTitle>
          {/* You could add a hidden input for barcode here if preferred */}
          {/* <Input className="barcode-input absolute -top-96" /> */}
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Customer Selection with Search */}
          <div className="space-y-2">
            <Label htmlFor="customer-search" className="font-semibold">
              Customer
            </Label>
            <div className="flex items-center gap-2">
              <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerSearchOpen}
                    className="w-full justify-between flex-1"
                    disabled={isLoadingCustomers}
                  >
                    {isLoadingCustomers ? 'Loading...' : selectedCustomerName}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search customer (name or phone)..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          key="walk-in"
                          value="Walk-in Customer"
                          onSelect={() => {
                            setSelectedCustomer(null);
                            setCustomerSearchOpen(false);
                          }}
                        >
                          Walk-in Customer
                        </CommandItem>
                        {customers.map(customer => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.name} ${customer.phoneNumber || ''}`}
                            onSelect={() => {
                              setSelectedCustomer(customer.id);
                              setCustomerSearchOpen(false);
                            }}
                          >
                            {customer.name} {customer.phoneNumber && `(${customer.phoneNumber})`}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button variant="outline" asChild size="icon">
                <Link href={`/customers?create=true`}>
                  <UserPlus size={16} />
                </Link>
              </Button>
            </div>
          </div>

          {/* Cart Items (Unchanged) */}
          <div className="space-y-3">
            <Label className="font-semibold">Items in Cart</Label>
            {groupedCartArray.length === 0 ? (
              <p className="text-gray-500 text-center py-10">Your cart is empty. Add items or scan a barcode.</p>
            ) : (
              <div className="border rounded-md divide-y">
                {groupedCartArray.map(item => (
                  <div key={item.uniqueKey} className="flex items-center p-3 hover:bg-gray-50">
                    <div className="flex-1 mr-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.selectedVariant.name}</p>
                      <p className="text-sm font-semibold text-blue-600">
                        {formatCurrency(item.retailPrice.toString())}
                      </p>
                    </div>
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                        onClick={() => handleQuantityChange(item.uniqueKey, -1)}
                      >
                        <Minus size={14} />
                      </Button>
                      <span className="px-3 text-sm font-medium w-10 text-center">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                        onClick={() => handleQuantityChange(item.uniqueKey, 1)}
                      >
                        <Plus size={14} />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(item.uniqueKey)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>

        {/* --- Fixed Footer Section --- */}
        <CardFooter className="p-4 border-t bg-gray-50 flex flex-col space-y-4">
          {/* Summary (Unchanged) */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-sm font-medium">{formatCurrency(cartTotal.toString())}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">VAT (16%):</span>
              <span className="text-sm font-medium">{formatCurrency(vatAmount.toString())}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(totalWithVAT.toString())}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2 w-full">
            <Label className="font-semibold">Payment Method</Label>
            <div className="flex space-x-2">
              <Button
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('cash')}
                className="flex-1"
              >
                <DollarSign size={16} className="mr-2" />
                Cash
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('card')}
                className="flex-1"
              >
                <CreditCard size={16} className="mr-2" />
                Card
              </Button>
              <Button
                variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('mobile')}
                className="flex-1"
              >
                <Smartphone size={16} className="mr-2" />
                M-Pesa
              </Button>
            </div>
            {errors.paymentMethod && <p className="text-red-500 text-xs">{errors.paymentMethod}</p>}
          </div>

          {/* Payment Details - Conditional */}
          <div className="w-full p-4 border rounded-md bg-white min-h-[100px]">
            {!paymentMethod && <p className="text-gray-500 text-center">Select a payment method above.</p>}
            {paymentMethod === 'card' && (
              <div className="space-y-3">
                <Label>Card Details</Label>
                <div>
                  <Input
                    id="cardNumber"
                    value={paymentDetails.cardNumber}
                    onChange={e => handleInputChange('cardNumber', e.target.value)}
                    placeholder="Card Number (16 digits)"
                    maxLength={19} // Allow spaces
                  />
                  {errors.cardNumber && <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>}
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      id="cardExpiry"
                      value={paymentDetails.cardExpiry}
                      onChange={e => handleInputChange('cardExpiry', e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                    {errors.cardExpiry && <p className="text-red-500 text-xs mt-1">{errors.cardExpiry}</p>}
                  </div>
                  <div className="flex-1">
                    <Input
                      id="cardCVC"
                      value={paymentDetails.cardCVC}
                      onChange={e => handleInputChange('cardCVC', e.target.value)}
                      placeholder="CVC"
                      maxLength={4}
                    />
                    {errors.cardCVC && <p className="text-red-500 text-xs mt-1">{errors.cardCVC}</p>}
                  </div>
                </div>
                <p className="text-xs text-gray-400">Card payments are recorded but not processed online.</p>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="space-y-3">
                <Label htmlFor="cashAmount">Cash Details</Label>
                <Input
                  id="cashAmount"
                  type="number"
                  step="0.01"
                  value={paymentDetails.cashAmount}
                  onChange={e => handleInputChange('cashAmount', e.target.value)}
                  placeholder={`Amount Tendered (min ${formatCurrency(totalWithVAT.toString())})`}
                />
                {errors.cashAmount && <p className="text-red-500 text-xs mt-1">{errors.cashAmount}</p>}
                {parseFloat(paymentDetails.cashAmount) >= totalWithVAT && !errors.cashAmount && (
                  <div className="text-sm text-green-600 font-medium">
                    Change Due: {formatCurrency((parseFloat(paymentDetails.cashAmount) - totalWithVAT).toString())}
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'mobile' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <img src="/mpesa.png" alt="M-Pesa" className="h-6 w-auto" />
                  <Label htmlFor="mobileNumber">M-Pesa Details</Label>
                </div>
                <Input
                  id="mobileNumber"
                  value={paymentDetails.mobileNumber}
                  onChange={e => handleInputChange('mobileNumber', e.target.value)}
                  placeholder="Enter M-Pesa Number (e.g., 2547...)"
                />
                {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>}
                {errors.mpesa && <p className="text-red-500 text-xs mt-1">{errors.mpesa}</p>}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errors.general && <p className="text-red-500 text-xs text-center w-full">{errors.general}</p>}

          {/* Action Buttons */}
          <div className="w-full space-y-2">
            <Button
              onClick={handlePaymentSubmit}
              disabled={groupedCartArray.length === 0 || isProcessing || processingSale || !paymentMethod}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
            >
              {isProcessing || processingSale
                ? 'Processing...'
                : `Complete Sale (${formatCurrency(totalWithVAT.toString())})`}
            </Button>
            <Button variant="outline" onClick={onClearCart} disabled={groupedCartArray.length === 0} className="w-full">
              Clear Cart
            </Button>
          </div>
        </CardFooter>
      </Card>
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          // Optionally, ensure cleanup happens when modal is closed if not done before
          // cleanupAfterSale();
        }}
        saleId={currentSaleId}
        receiptBlob={receiptBlob}
        onDownload={handleDownloadReceipt}
        onPrint={handlePrintReceipt}
        changeDue={changeDue}
      />
    </>
  );
};

export default CartComponent;
