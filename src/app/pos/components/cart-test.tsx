import { useState } from 'react';
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
} from 'lucide-react';
import Image from 'next/image';
import { generateReceiptHTML } from '../actions/receipt-html';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
  product: {
    name: string;
    sku: string;
  };
  variant: {
    name: string;
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

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      setShowPaymentModal(true);
    }
  };

  const handleSubmitSale = async () => {
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
      setLoading(false);
    } catch (error) {
      console.error('Error submitting sale:', error);
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Generate receipt HTML
    const receiptHTML = generateReceiptHTML(receipt);

    // Write to the new window and print
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleDownloadReceipt = () => {
    if (!receipt) return;

    // Create a blob with receipt HTML
    const receiptHTML = generateReceiptHTML(receipt);
    const blob = new Blob([receiptHTML], { type: 'text/html' });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.saleNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  // Calculate cart summary data
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = cartItems.length;

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 shadow-md bg-white h-full">
      {/* Cart Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center text-lg font-medium text-gray-700">
          <ShoppingCart className="mr-2 h-5 w-5 text-blue-500" />
          Shopping Cart
        </div>
        {cartItems.length > 0 && (
          <button onClick={onClearCart} className="flex items-center text-sm text-red-500 hover:text-red-700">
            <Trash2 className="mr-1 h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <ShoppingCart className="h-16 w-16 mb-2 opacity-30" />
            <p>Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                {/* Item Image */}
                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 flex items-center justify-center">
                  {item.imageUrls && item.imageUrls.length > 0 ? (
                    <Image 
                      src={item.imageUrls[0]} 
                      alt={item?.name} 
                      width={100} 
                      height={100} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                {/* Item Details */}
                <div className="ml-4 flex-grow">
                  <h3 className="font-medium text-gray-800">{item?.name}</h3>
                  <p className="text-xs text-gray-500">{item.sku}</p>
                  <p className="text-sm font-semibold mt-1">${Number(item.unitPrice)}</p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="text-gray-500 hover:text-red-600 focus:outline-none"
                  >
                    <MinusCircle size={20} />
                  </button>
                  <div className="mx-2 w-8 text-center font-medium">{item.quantity}</div>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="text-gray-500 hover:text-green-600 focus:outline-none"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="ml-2 text-gray-400 hover:text-red-600 focus:outline-none"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Footer */}
      <div className="p-4 border-t border-gray-200">
        {/* Cart Summary */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-gray-500 text-sm">
            <span>Items:</span>
            <span>{totalItems} ({uniqueItems} unique)</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-700">
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
          ${cartItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          Proceed to Checkout
        </button>
      </div>

      {/* Payment Dialog with shadcn Dialog */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Sale</DialogTitle>
            <DialogDescription>
              Select payment method and other details to complete the sale.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Customer Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer</label>
              <div className="relative">
                <button
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  className="w-full flex items-center justify-between border border-gray-300 rounded-md p-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span>
                    {selectedCustomer
                      ? customers.find(c => c.id === selectedCustomer)?.name || 'Select Customer'
                      : 'Walk-in Customer'}
                  </span>
                  <ChevronDown size={16} />
                </button>
                
                {showCustomerDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div
                      className="p-2 hover:bg-gray-100 cursor-pointer"
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
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedCustomer(customer.id);
                          setShowCustomerDropdown(false);
                        }}
                      >
                        {customer?.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-3 border rounded-md ${
                    paymentMethod === 'CASH' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('CASH')}
                >
                  <Banknote size={20} className={paymentMethod === 'CASH' ? 'text-blue-500' : 'text-gray-500'} />
                  <span className="mt-1 text-xs">Cash</span>
                </button>
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-3 border rounded-md ${
                    paymentMethod === 'CARD' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('CARD')}
                >
                  <CreditCard size={20} className={paymentMethod === 'CARD' ? 'text-blue-500' : 'text-gray-500'} />
                  <span className="mt-1 text-xs">Card</span>
                </button>
                <button
                  type="button"
                  className={`flex flex-col items-center justify-center p-3 border rounded-md ${
                    paymentMethod === 'MOBILE_MONEY' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-gray-300'
                  }`}
                  onClick={() => setPaymentMethod('MOBILE_MONEY')}
                >
                  <Smartphone size={20} className={paymentMethod === 'MOBILE_MONEY' ? 'text-blue-500' : 'text-gray-500'} />
                  <span className="mt-1 text-xs">Mobile</span>
                </button>
              </div>
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add notes about this sale..."
              ></textarea>
            </div>
            
            {/* Sale Summary */}
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="flex justify-between font-medium">
                <span>Total Items:</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex justify-between text-lg font-bold mt-1">
                <span>Amount:</span>
                <span>${parseFloat(cartTotal)}</span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitSale} 
              disabled={loading || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {(loading || isSubmitting) ? "Processing..." : "Complete Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog with shadcn Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Sale Completed</DialogTitle>
          </DialogHeader>
          
          {receipt && (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle size={40} className="text-green-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-medium text-center mb-2">Sale #{receipt.saleNumber}</h3>
              
              <div className="space-y-2 mb-4 text-sm">
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
                  <span>{receipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span>${receipt.finalAmount}</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 mb-4">
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {receipt.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.product?.name} x {item.quantity}
                      </span>
                      <span>${item.totalAmount}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button onClick={handlePrintReceipt} variant="outline" className="flex items-center">
                  <Printer size={16} className="mr-1" />
                  Print
                </Button>
                <Button onClick={handleDownloadReceipt} variant="outline" className="flex items-center">
                  <Download size={16} className="mr-1" />
                  Download
                </Button>
                <Button onClick={() => setShowReceipt(false)} className="bg-blue-600">
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
