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
import Pusher from 'pusher-js';

/**
 * Customer interface represents a customer in the POS system
 */
export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

/**
 * Cart item interface for managing items in the shopping cart
 */
export interface CartItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number | string;
  totalPrice: string | number;
  variantId?: string | null;
  imageUrls?: string[] | null;
}

/**
 * Sale data interface for submitting a sale
 */
export interface SaleData {
  customerId: string | null;
  paymentMethod: string;
  notes: string;
}

/**
 * Sale result interface for receipt data
 */
export interface SaleResult {
  id: string;
  saleNumber: string;
  customerId: string | null;
  memberId: string;
  saleDate: Date;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  locationId: string;
  notes: string;
  cashDrawerId: string | null;
  receiptUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  items: SaleResultItem[];
  customer: Customer | null;
  member: {
    id: string;
    user: {
      name: string;
    };
  };
  organization: {
    id: string;
    name: string;
    logo: string;
  };
}

/**
 * Sale result item interface
 */
export interface SaleResultItem {
  id: string;
  saleId: string;
  productId: string;
  variantId: string;
  stockBatchId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  product?: {
    name: string;
    sku: string;
  };
  variant: {
    name: string;
    product?: {
      name: string;
      sku: string;
    };
  };
}

/**
 * Props for the Cart component
 */
export interface CartProps {
  cartItems: CartItem[];
  cartTotal: string;
  customers: Customer[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onSubmitSale: (saleData: SaleData) => Promise<SaleResult>;
  isSubmitting?: boolean;
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
export default function Cart({
  cartItems,
  cartTotal,
  customers,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSubmitSale,
  isSubmitting = false,
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

  // Initialize Pusher for M-Pesa payment status updates
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('mpesa-payments');
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
      const pdfUrl = URL.createObjectURL(pdfBlob);

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
      const url = URL.createObjectURL(pdfBlob);
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
    <div className="flex flex-col rounded-lg border border-gray-200 shadow-sm bg-white h-full overflow-hidden">
      {/* Cart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50 rounded-t-lg">
        <div className="flex items-center text-lg font-medium text-gray-800">
          <ShoppingCart className="mr-2 h-5 w-5 text-blue-600" />
          Shopping Cart
        </div>
        {cartItems.length > 0 && (
          <button
            onClick={onClearCart}
            className="flex items-center text-sm text-red-600 hover:text-red-800 transition-colors"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ShoppingCart className="h-16 w-16 mb-3 opacity-40" />
            <p className="text-gray-500">Your cart is empty</p>
            <p className="text-sm text-gray-400 mt-1">Add items to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map(item => (
              <div
                key={item.id}
                className="flex items-center p-3 border border-gray-100 rounded-lg bg-white shadow-xs hover:shadow-sm transition-shadow"
              >
                {/* Item Image */}
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200">
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <Image
                      src={item.imageUrls[0]}
                      alt={item.name}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                {/* Item Details */}
                <div className="ml-3 flex-grow min-w-0">
                  <h3 className="font-medium text-gray-800 truncate">{item.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{item.sku}</p>
                  <p className="text-sm font-semibold mt-1 text-blue-600">${Number(item.unitPrice)}</p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center ml-2">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="text-gray-500 hover:text-red-600 transition-colors focus:outline-none"
                    disabled={item.quantity <= 1}
                  >
                    <MinusCircle size={20} className={item.quantity <= 1 ? 'opacity-40' : ''} />
                  </button>
                  <div className="mx-2 w-8 text-center font-medium text-gray-700">{item.quantity}</div>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="text-gray-500 hover:text-green-600 transition-colors focus:outline-none"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="ml-2 text-gray-400 hover:text-red-600 transition-colors focus:outline-none"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {/* Cart Summary */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Items:</span>
            <span>
              {totalItems} ({uniqueItems} unique)
            </span>
          </div>
          <div className="flex justify-between font-medium text-gray-700">
            <span>Subtotal:</span>
            <span>${parseFloat(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-gray-900">
            <span>Total:</span>
            <span>${parseFloat(cartTotal)}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={cartItems.length === 0}
          className={`w-full py-3 px-4 rounded-lg flex items-center justify-center font-semibold text-white 
          transition-colors ${
            cartItems.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md'
          }`}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          Proceed to Checkout
        </button>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[500px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">Complete Payment</DialogTitle>
            <DialogDescription className="text-gray-600">
              Select your preferred payment method to finalize the transaction
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Customer</label>
              <div className="relative">
                <button
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  className="w-full flex items-center justify-between border border-gray-300 rounded-lg p-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="truncate">
                    {selectedCustomer
                      ? customers.find(c => c.id === selectedCustomer)?.name || 'Select Customer'
                      : 'Walk-in Customer'}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-500 transition-transform ${showCustomerDropdown ? 'rotate-180' : ''}`}
                  />
                </button>

                {showCustomerDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    <div
                      className="p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setShowCustomerDropdown(false);
                      }}
                    >
                      Walk-in Customer
                    </div>
                    {customers?.map(customer => (
                      <div
                        key={customer.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer transition-colors truncate border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setSelectedCustomer(customer.id);
                          setShowCustomerDropdown(false);
                        }}
                      >
                        {customer.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setPaymentMethod('CASH')}
                >
                  <Banknote size={22} className={paymentMethod === 'CASH' ? 'text-blue-500' : 'text-gray-500'} />
                  <span className="mt-2 text-sm font-medium">Cash</span>
                </button>
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    paymentMethod === 'CARD'
                      ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setPaymentMethod('CARD')}
                >
                  <CreditCard size={22} className={paymentMethod === 'CARD' ? 'text-blue-500' : 'text-gray-500'} />
                  <span className="mt-2 text-sm font-medium">Card</span>
                </button>
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                    paymentMethod === 'MOBILE_MONEY'
                      ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setPaymentMethod('MOBILE_MONEY')}
                >
                  <Smartphone
                    size={22}
                    className={paymentMethod === 'MOBILE_MONEY' ? 'text-blue-500' : 'text-gray-500'}
                  />
                  <span className="mt-2 text-sm font-medium">M-Pesa</span>
                </button>
              </div>
            </div>

            {/* M-Pesa Status Display */}
            {paymentMethod === 'MOBILE_MONEY' && mpesaPayment && (
              <div
                className={`p-4 rounded-lg border ${
                  mpesaPayment.status === 'SUCCESS'
                    ? 'border-green-200 bg-green-50'
                    : mpesaPayment.status === 'FAILED'
                      ? 'border-red-200 bg-red-50'
                      : 'border-blue-200 bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {mpesaPayment.status === 'PENDING'
                        ? 'Waiting for payment...'
                        : mpesaPayment.status === 'SUCCESS'
                          ? 'Payment successful!'
                          : 'Payment failed'}
                    </p>
                    {mpesaPayment.customerMessage && <p className="text-sm mt-1">{mpesaPayment.customerMessage}</p>}
                  </div>
                  {mpesaPayment.status === 'PENDING' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                </div>
              </div>
            )}

            {/* Phone Number (Conditional for Mobile Money) */}
            {paymentMethod === 'MOBILE_MONEY' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">+1</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="w-full pl-12 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400"
                placeholder="Add any special instructions or notes..."
              />
            </div>

            {/* Sale Summary */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Total Items:</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-medium">${parseFloat(cartTotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax:</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total:</span>
                  <span>${parseFloat(cartTotal).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setShowPaymentModal(false)}
              className="h-11 px-6 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitSale}
              disabled={loading || isSubmitting || isMpesaProcessing}
              className="h-11 px-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md text-white rounded-lg"
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
        <DialogContent className="sm:max-w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Sale Completed</DialogTitle>
            <DialogDescription className="text-gray-600">Receipt #{receipt?.saleNumber}</DialogDescription>
          </DialogHeader>

          {receipt && (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full animate-pulse">
                  <CheckCircle size={40} className="text-green-600" />
                </div>
              </div>

              <h3 className="text-lg font-medium text-center mb-2 text-gray-800">Sale #{receipt.saleNumber}</h3>

              <div className="space-y-2 mb-4 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span>{new Date(receipt.saleDate).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span>{receipt.customer?.name || 'Walk-in Customer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="capitalize">{receipt.paymentMethod.toLowerCase().replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal:</span>
                  <span>${parseFloat(receipt.totalAmount.toString() || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax:</span>
                  <span>${parseFloat(receipt.taxAmount.toString() || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount:</span>
                  <span>${parseFloat(receipt.discountAmount?.toString() || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-700">Final Amount:</span>
                  <span>${parseFloat(receipt.finalAmount?.toString() || '0').toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-4">
                <h4 className="font-medium mb-2 text-gray-800">Items</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {receipt.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.variant.product?.name || item.variant.name} x {item.quantity}
                        {item.variant.name && item.variant.product?.name && ` (${item.variant.name})`}
                      </span>
                      <div className="text-right">
                        <div className="font-medium">${parseFloat(item.totalAmount.toString() || '0').toFixed(2)}</div>
                        <div className="text-xs text-gray-500">${parseFloat(item.unitPrice.toString() || '0').toFixed(2)} each</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={handlePrintReceipt}
                  variant="outline"
                  className="flex items-center border-gray-300 hover:bg-gray-50"
                  disabled={isPrinting}
                >
                  {isPrinting ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="mr-1 h-4 w-4" />
                  )}
                  Print
                </Button>
                <Button
                  onClick={handleDownloadReceipt}
                  variant="outline"
                  className="flex items-center border-gray-300 hover:bg-gray-50"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-1 h-4 w-4" />
                  )}
                  Download
                </Button>
                <Button onClick={() => setShowReceipt(false)} className="bg-blue-600 hover:bg-blue-700 shadow-md">
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
