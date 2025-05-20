import { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  PlusCircle,
  MinusCircle,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  Download,
  CheckCircle,
  ChevronDown,
  Loader2,
  ChevronRight,
  ShoppingBag,
  Receipt,
} from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateAndSaveReceiptPdf } from '@/utils/pdf';
import { formatCurrency } from '@/lib/utils';
import { pusherClient } from '@/utils/pusher';
import { CartItem, Customer, SaleData, SaleResult } from '../types';
import { useAppStore } from '@/store/app';

/**
 * Props for the Cart component
 */
interface CartProps {
  cartItems: CartItem[];
  cartTotal: string;
  customers: Customer[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onSubmitSale: (saleData: SaleData) => Promise<SaleResult>;
  isSubmitting?: boolean;
  onClose?: () => void;
}

// Add M-Pesa payment status type
type MpesaPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

// Add M-Pesa payment interface
interface MpesaPayment {
  status: MpesaPaymentStatus;
  checkoutRequestId?: string;
  merchantRequestId?: string;
  responseCode?: string;
  responseDescription?: string;
  customerMessage?: string;
}

/**
 * Cart component for managing shopping cart items and checkout
 */
function CartComponent({
  cartItems,
  cartTotal,
  customers,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitSale,
  isSubmitting = false,
  onClose,
}: CartProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [notes, setNotes] = useState<string>('');
  const [receipt, setReceipt] = useState<SaleResult | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [mpesaPayment, setMpesaPayment] = useState<MpesaPayment | null>(null);
  const [isMpesaProcessing, setIsMpesaProcessing] = useState(false);

  
    const tax = 0.16
    const taxAmount = tax * Number(cartTotal); 
    const totalPrice = Number(cartTotal) + taxAmount
    
    const org = useAppStore((o)=>o.organization)
    console.log(org)

  useEffect(() => {
    const channel = pusherClient.subscribe('mpesa-payments');
    channel.bind('payment-status', (data: MpesaPayment) => {
      setMpesaPayment(data);
      if (data.status === 'SUCCESS' || data.status === 'FAILED') {
        setIsMpesaProcessing(false);
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      setShowPaymentModal(true);
    }
  };

  const handleMpesaPayment = async () => {
    if (!phoneNumber) {
      alert('Please enter a valid phone number');
      return;
    }

    setIsMpesaProcessing(true);
    try {
      const response = await fetch('/api/mpesa/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          amount: parseFloat(cartTotal),
          saleData: {
            customerId: selectedCustomer,
            paymentMethod: 'MOBILE_MONEY',
            notes,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate M-Pesa payment');
      }

      setMpesaPayment({
        status: 'PENDING',
        checkoutRequestId: data.CheckoutRequestID,
        merchantRequestId: data.MerchantRequestID,
        customerMessage: data.CustomerMessage,
      });
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      setIsMpesaProcessing(false);
      alert('Failed to initiate M-Pesa payment. Please try again.');
    }
  };

  const handleSubmitSale = async () => {
    if (paymentMethod === 'MOBILE_MONEY') {
      await handleMpesaPayment();
      return;
    }

    setLoading(true);
    try {
      const saleData: SaleData = {
        customerId: selectedCustomer,
        paymentMethod,
        notes,
      };

      const result = await onSubmitSale(saleData);
      setReceipt(result);
      setShowPaymentModal(false);
      setShowReceipt(true);
    } catch (error) {
      console.error('Error submitting sale:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!receipt) return;

    setIsPrinting(true);
    try {
      //@ts-expect-error Type 'Promise<unknown>' is not assignable to type 'Blob'. .toFixed
      const pdfBlob = await generateAndSaveReceiptPdf(receipt);
      const pdfUrl = URL.createObjectURL(pdfBlob!);

      // Create an iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = pdfUrl;

      iframe.onload = () => {
        setTimeout(() => {
          iframe.contentWindow?.print();
          URL.revokeObjectURL(pdfUrl);
          setIsPrinting(false);
        }, 500);
      };

      document.body.appendChild(iframe);
    } catch (error) {
      console.error('Error printing receipt:', error);
      setIsPrinting(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!receipt) return;

    setIsDownloading(true);
    try {
      //@ts-expect-error Type 'Promise<unknown>' is not assignable to type 'Blob'.
      const pdfBlob = await generateAndSaveReceiptPdf(receipt);
      const url = URL.createObjectURL(pdfBlob!);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receipt.saleNumber}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsDownloading(false);
      }, 100);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      setIsDownloading(false);
    }
  };

  // Calculate cart summary data
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = cartItems.length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Cart Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShoppingBag className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Your Cart</h2>
              <p className="text-blue-100 text-sm">
                {totalItems > 0 ? `${totalItems} ${totalItems === 1 ? 'item' : 'items'}` : 'Empty cart'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {cartItems.length > 0 && (
              <button
                onClick={onClearCart}
                className="flex items-center text-sm text-blue-100 hover:text-white transition-colors rounded-full hover:bg-blue-500/20 p-2"
                title="Clear cart"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="text-blue-100 hover:text-white p-2 rounded-full hover:bg-blue-500/20"
                title="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 bg-gray-50 dark:bg-neutral-800/30">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-5 mb-4">
              <ShoppingCart className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs">
              Add items from the product catalog to begin your transaction
            </p>
          </div>
        ) : (
          <div className="pb-2">
            {cartItems.map(item => (
              <div
                key={item.id}
                className="group relative bg-white dark:bg-neutral-800 rounded-xl p-3 mb-3 shadow-sm hover:shadow transition-all duration-200 border border-gray-100 dark:border-neutral-700/50"
              >
                <div className="flex">
                  {/* Item Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-neutral-700 flex-shrink-0">
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <Image
                        src={item.imageUrls[0]}
                        alt={item.name}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="ml-3 flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-gray-100">{item.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku}</p>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                        aria-label="Remove item"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex justify-between items-end mt-2">
                      <div className="text-blue-600 dark:text-blue-400 font-medium">
                        {formatCurrency(item.unitPrice)}
                      </div>
                      <div className="flex items-center border border-gray-200 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-900">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <MinusCircle size={16} className={item.quantity <= 1 ? 'opacity-40' : ''} />
                        </button>
                        <span className="px-3 font-medium text-gray-700 dark:text-gray-300">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                        >
                          <PlusCircle size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
                      Total:
                      {formatCurrency(parseFloat(item.totalPrice.toLocaleString()))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      <div className="p-5 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700">
        {/* Cart Summary */}
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 mb-4 border border-blue-100 dark:border-blue-900/30 shadow-sm">
          <div className="flex items-center mb-3">
            <Receipt className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Order Summary</h3>
          </div>

          <div className="space-y-2 pb-3 border-b border-blue-100 dark:border-blue-800/30">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tax ({tax *100}%)</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(taxAmount.toFixed(2))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Discount</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(0.0)}</span>
            </div>
          </div>

          <div className="flex justify-between pt-3 text-lg font-bold">
            <span className="text-gray-800 dark:text-white">Total</span>
            <span className="text-blue-700 dark:text-blue-400">{formatCurrency(totalPrice)}</span>
          </div>

          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
            {totalItems} {totalItems === 1 ? 'item' : 'items'} ({uniqueItems}{' '}
            {uniqueItems === 1 ? 'product' : 'products'})
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={cartItems.length === 0}
          className={`w-full py-4 px-6 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${
            cartItems.length === 0
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-600'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl dark:from-blue-700 dark:to-blue-800'
          }`}
        >
          <CreditCard className="mr-3 h-5 w-5" />
          {cartItems.length > 0 ? `Checkout • ${formatCurrency(cartTotal)}` : 'Checkout'}
          <CreditCard className="mr-2 h-5 w-5" />
          Proceed to Checkout
        </button>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[550px] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-2xl font-bold text-white">Complete Your Purchase</DialogTitle>
              <DialogDescription className="text-blue-100">
                Select payment method and review your order details
              </DialogDescription>
            </DialogHeader>

            <div className="bg-blue-500/30 rounded-xl p-4 backdrop-blur-sm mt-4">
              <div className="flex justify-between items-center">
                <span className="text-blue-100">Total Amount</span>
                <span className="text-2xl font-bold">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="text-xs text-blue-200 mt-1">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} in cart
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                Select Customer
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  className="w-full flex items-center justify-between border border-gray-300 dark:border-neutral-700 rounded-xl p-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span className="truncate font-medium text-gray-800 dark:text-gray-200">
                    {selectedCustomer
                      ? customers.find(c => c.id === selectedCustomer)?.name || 'Select Customer'
                      : 'Walk-in Customer'}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-500 dark:text-gray-400 transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`}
                  />
                </button>

                {showCustomerDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-xl max-h-60 overflow-auto">
                    <div
                      className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors border-b border-gray-100 dark:border-neutral-700"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setShowCustomerDropdown(false);
                      }}
                    >
                      <div className="font-medium text-gray-800 dark:text-gray-200">Walk-in Customer</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">No customer information needed</div>
                    </div>
                    {customers?.map(customer => (
                      <div
                        key={customer.id}
                        className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors border-b border-gray-100 dark:border-neutral-700 last:border-b-0"
                        onClick={() => {
                          setSelectedCustomer(customer.id);
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <div className="font-medium text-gray-800 dark:text-gray-200">{customer.name}</div>
                        {(customer.email || customer.phone) && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {customer.email || customer.phone}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <CreditCard className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'border border-gray-200 dark:border-neutral-700 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-gray-50 dark:hover:bg-neutral-700'
                  }`}
                  onClick={() => setPaymentMethod('CASH')}
                >
                  <Banknote
                    size={24}
                    className={
                      paymentMethod === 'CASH' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    }
                  />
                  <span
                    className={`mt-2 text-sm font-medium ${
                      paymentMethod === 'CASH' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    Cash
                  </span>
                </button>

                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                    paymentMethod === 'CARD'
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'border border-gray-200 dark:border-neutral-700 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-gray-50 dark:hover:bg-neutral-700'
                  }`}
                  onClick={() => setPaymentMethod('CARD')}
                >
                  <CreditCard
                    size={24}
                    className={
                      paymentMethod === 'CARD' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    }
                  />
                  <span
                    className={`mt-2 text-sm font-medium ${
                      paymentMethod === 'CARD' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    Card
                  </span>
                </button>

                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
                    paymentMethod === 'MOBILE_MONEY'
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'border border-gray-200 dark:border-neutral-700 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-gray-50 dark:hover:bg-neutral-700'
                  }`}
                  onClick={() => setPaymentMethod('MOBILE_MONEY')}
                >
                  <Smartphone
                    size={24}
                    className={
                      paymentMethod === 'MOBILE_MONEY'
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }
                  />
                  <span
                    className={`mt-2 text-sm font-medium ${
                      paymentMethod === 'MOBILE_MONEY'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    M-Pesa
                  </span>
                </button>
              </div>
            </div>

            {/* M-Pesa Status Display */}
            {paymentMethod === 'MOBILE_MONEY' && mpesaPayment && (
              <div
                className={`p-4 rounded-xl ${
                  mpesaPayment.status === 'SUCCESS'
                    ? 'border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20'
                    : mpesaPayment.status === 'FAILED'
                      ? 'border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'
                      : 'border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`font-medium ${
                        mpesaPayment.status === 'SUCCESS'
                          ? 'text-green-700 dark:text-green-400'
                          : mpesaPayment.status === 'FAILED'
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {mpesaPayment.status === 'PENDING'
                        ? 'Waiting for payment...'
                        : mpesaPayment.status === 'SUCCESS'
                          ? 'Payment successful!'
                          : 'Payment failed'}
                    </p>
                    {mpesaPayment.customerMessage && (
                      <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">{mpesaPayment.customerMessage}</p>
                    )}
                  </div>
                  {mpesaPayment.status === 'PENDING' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500 dark:text-blue-400" />
                  )}
                </div>
              </div>
            )}

            {/* Phone Number (Conditional for Mobile Money) */}
            {paymentMethod === 'MOBILE_MONEY' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400">+1</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="w-full pl-12 border border-gray-300 dark:border-neutral-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <ChevronRight className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full border border-gray-300 dark:border-neutral-700 rounded-xl p-3 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400 bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200"
                placeholder="Add any special instructions or notes..."
              />
            </div>
          </div>

          <DialogFooter className="bg-gray-50 dark:bg-neutral-900 p-6 border-t border-gray-200 dark:border-neutral-800">
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              className="h-12 px-6 rounded-xl border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitSale}
              disabled={loading || isSubmitting || isMpesaProcessing}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl"
            >
              {loading || isSubmitting || isMpesaProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {paymentMethod === 'MOBILE_MONEY' ? 'Processing M-Pesa...' : 'Processing...'}
                </>
              ) : (
                'Complete Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl bg-white dark:bg-neutral-900 p-0 border-0 shadow-2xl overflow-hidden">
          {receipt && (
            <>
              <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full">
                    <CheckCircle size={40} className="text-white" />
                  </div>
                </div>

                <DialogHeader>
                  <DialogTitle className="text-center text-2xl font-bold text-white">Payment Successful</DialogTitle>
                  <DialogDescription className="text-center text-green-100">
                    Receipt #{receipt.saleNumber}
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 p-3 bg-white/20 backdrop-blur-sm rounded-xl text-center">
                  <div className="text-sm text-green-100">Amount Paid</div>
                  <div className="text-2xl font-bold">{formatCurrency(receipt.finalAmount?.toString())}</div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4 mb-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-neutral-800 p-3 rounded-xl">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Date</div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">
                        {new Date(receipt.saleDate).toLocaleDateString()}
                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                          {new Date(receipt.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-neutral-800 p-3 rounded-xl">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Payment Method</div>
                      <div className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                        {receipt.paymentMethod.toLowerCase().replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-neutral-800 p-3 rounded-xl">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Customer</div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {receipt.customer?.name || 'Walk-in Customer'}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-neutral-800 pt-5 mb-4">
                  <h4 className="font-medium mb-3 text-gray-800 dark:text-gray-200 flex items-center">
                    <ShoppingBag className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Items Purchased
                  </h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                    {receipt.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm bg-gray-50 dark:bg-neutral-800 p-3 rounded-lg"
                      >
                        <div className="flex flex-col">
                          <span className="text-gray-800 dark:text-gray-200 font-medium">
                            {item.variant.product?.name || item.variant.name}
                            {item.variant.name && item.variant.product?.name && (
                              <span className="text-gray-500 dark:text-gray-400 font-normal">
                                {' '}
                                ({item.variant.name})
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Qty: {item.quantity} x{' '}
                            {formatCurrency(parseFloat(item.unitPrice.toString() || '0').toFixed(2))}
                          </span>
                        </div>
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          ${formatCurrency(parseFloat(item.totalAmount.toString() || '0').toFixed(2))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {formatCurrency(parseFloat(receipt.totalAmount.toString() || '0').toFixed(2))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tax</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {formatCurrency(parseFloat(receipt.taxAmount.toString() || '0').toFixed(2))}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Discount</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {formatCurrency(parseFloat(receipt.discountAmount?.toString() || '0').toFixed(2))}
                      </span>
                    </div>
                    <div className="border-t border-blue-200 dark:border-blue-800/30 pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-800 dark:text-gray-200">Total</span>
                        <span className="text-blue-700 dark:text-blue-400">
                          {formatCurrency(parseFloat(receipt.finalAmount?.toString() || '0').toFixed(2))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-neutral-800 p-5 bg-gray-50 dark:bg-neutral-900 flex justify-end space-x-3">
                <Button
                  onClick={handlePrintReceipt}
                  variant="outline"
                  className="h-11 px-5 rounded-xl border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-700 flex items-center"
                  disabled={isPrinting}
                >
                  {isPrinting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-500 dark:text-gray-400" />
                  ) : (
                    <Printer className="mr-2 h-4 w-4 text-gray-600 dark:text-gray-400" />
                  )}
                  Print Receipt
                </Button>
                <Button
                  onClick={handleDownloadReceipt}
                  className="h-11 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white flex items-center"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CartComponent;