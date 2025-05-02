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
  Info,
} from 'lucide-react';
import Image from 'next/image';

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

  const generateReceiptHTML = (receipt: SaleResult | null) => {
    if (!receipt) return '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.saleNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .receipt {
            border: 1px solid #ddd;
            padding: 20px;
          }
          .logo {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo img {
            max-height: 60px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .sale-info {
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border-bottom: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          .totals {
            margin-top: 20px;
            text-align: right;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
          @media print {
            body {
              padding: 0;
            }
            .receipt {
              border: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="logo">
            <img src="${receipt.organization.logo}" alt="${receipt.organization.name}">
          </div>
          <div class="header">
            <h2>${receipt.organization.name}</h2>
            <p>Receipt #${receipt.saleNumber}</p>
          </div>
          <div class="sale-info">
            <p><strong>Date:</strong> ${new Date(receipt.saleDate).toLocaleString()}</p>
            <p><strong>Customer:</strong> ${receipt.customer ? receipt.customer.name : 'Walk-in Customer'}</p>
            <p><strong>Payment Method:</strong> ${receipt.paymentMethod}</p>
            <p><strong>Payment Status:</strong> ${receipt.paymentStatus}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${receipt.items
                .map(
                  item => `
                <tr>
                  <td>${item.product.name}${item.variant ? ' - ' + item.variant.name : ''}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toFixed(2)}</td>
                  <td>$${item.totalAmount.toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div class="totals">
            <p><strong>Subtotal:</strong> $${receipt.totalAmount.toFixed(2)}</p>
            <p><strong>Discount:</strong> $${receipt.discountAmount.toFixed(2)}</p>
            <p><strong>Tax:</strong> $${receipt.taxAmount.toFixed(2)}</p>
            <p><strong>Total:</strong> $${receipt.finalAmount.toFixed(2)}</p>
          </div>
          <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>${receipt.organization.name}</p>
          </div>
        </div>
      </body>
      </html>
    `;
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
                    <Image src={item.imageUrls[0]} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 ml-4">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-gray-800">{item.name}</h3>
                    <button onClick={() => onRemoveItem(item.id)} className="text-gray-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="text-blue-500 hover:text-blue-700 disabled:text-gray-300"
                      >
                        <MinusCircle className="h-5 w-5" />
                      </button>
                      <span className="mx-2 w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <PlusCircle className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        ${typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : item.unitPrice}
                      </p>
                      <p className="font-medium">
                        ${typeof item.totalPrice === 'number' ? item.totalPrice.toFixed(2) : item.totalPrice}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart Summary */}
      <div className="border-t border-gray-200">
        <div className="p-4 bg-gray-50">
          <h3 className="font-medium mb-2 text-gray-700">Cart Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Items:</div>
            <div className="text-right">
              {totalItems} ({uniqueItems} unique)
            </div>
            <div>Subtotal:</div>
            <div className="text-right">${cartTotal}</div>
          </div>
        </div>
        <div className="p-4">
          <button
            onClick={handleCheckout}
            disabled={cartItems.length === 0}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md transition-colors"
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center border-b border-gray-200 p-4">
              <h2 className="text-lg font-medium">Complete Purchase</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Customer Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                <div className="relative">
                  <button
                    onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                    className="w-full flex justify-between items-center border border-gray-300 rounded-md px-3 py-2 bg-white text-left"
                  >
                    <span>
                      {selectedCustomer
                        ? customers.find(c => c.id === selectedCustomer)?.name || 'Unknown Customer'
                        : 'Walk-in Customer'}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>

                  {showCustomerDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                      <ul>
                        <li
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedCustomer(null);
                            setShowCustomerDropdown(false);
                          }}
                        >
                          Walk-in Customer
                        </li>
                        {customers.map(customer => (
                          <li
                            key={customer.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setSelectedCustomer(customer.id);
                              setShowCustomerDropdown(false);
                            }}
                          >
                            {customer.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex flex-col items-center justify-center border rounded-md p-3 ${
                      paymentMethod === 'CASH' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <Banknote className={`h-6 w-6 ${paymentMethod === 'CASH' ? 'text-blue-500' : 'text-gray-500'}`} />
                    <span className="text-sm mt-1">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('CARD')}
                    className={`flex flex-col items-center justify-center border rounded-md p-3 ${
                      paymentMethod === 'CARD' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <CreditCard className={`h-6 w-6 ${paymentMethod === 'CARD' ? 'text-blue-500' : 'text-gray-500'}`} />
                    <span className="text-sm mt-1">Card</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('MOBILE')}
                    className={`flex flex-col items-center justify-center border rounded-md p-3 ${
                      paymentMethod === 'MOBILE' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <Smartphone
                      className={`h-6 w-6 ${paymentMethod === 'MOBILE' ? 'text-blue-500' : 'text-gray-500'}`}
                    />
                    <span className="text-sm mt-1">Mobile</span>
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add any notes about this sale..."
                />
              </div>

              {/* Summary */}
              <div className="mb-4 bg-gray-50 p-3 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Total Items:</span>
                  <span>{totalItems}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total Amount:</span>
                  <span>${cartTotal}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitSale}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-md transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Complete Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && receipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-screen overflow-auto">
            <div className="flex justify-between items-center border-b border-gray-200 p-4 sticky top-0 bg-white">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <h2 className="text-lg font-medium">Payment Complete</h2>
              </div>
              <button onClick={() => setShowReceipt(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Success Message */}
              <div className="flex items-center justify-center mb-6 bg-green-50 p-4 rounded-md">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <h3 className="font-medium text-green-800">Payment Successful!</h3>
                  <p className="text-green-700">Sale #{receipt.saleNumber} has been completed.</p>
                </div>
              </div>

              {/* Receipt Content */}
              <div className="border border-gray-200 rounded-md mb-6">
                {/* Organization Info */}
                <div className="p-4 border-b border-gray-200 flex items-center">
                  {receipt.organization.logo && (
                    <Image
                      src={receipt.organization.logo}
                      alt={receipt.organization.name}
                      className="h-10 w-10 mr-3 rounded-md object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{receipt.organization.name}</h3>
                    <p className="text-sm text-gray-500">Receipt #{receipt.saleNumber}</p>
                  </div>
                </div>

                {/* Sale Details */}
                <div className="p-4 grid grid-cols-2 gap-4 text-sm border-b border-gray-200">
                  <div>
                    <p className="text-gray-500 mb-1">Date</p>
                    <p>{new Date(receipt.saleDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Payment Method</p>
                    <p>{receipt.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Customer</p>
                    <p>{receipt.customer ? receipt.customer.name : 'Walk-in Customer'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Status</p>
                    <p>{receipt.paymentStatus}</p>
                  </div>
                </div>

                {/* Items */}
                <div className="p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left pb-2">Item</th>
                        <th className="text-center pb-2">Qty</th>
                        <th className="text-right pb-2">Unit Price</th>
                        <th className="text-right pb-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.items.map(item => (
                        <tr key={item.id} className="border-b border-gray-100">
                          <td className="py-2">
                            <div className="font-medium">{item.product.name}</div>
                            {item.variant && <div className="text-xs text-gray-500">{item.variant.name}</div>}
                          </td>
                          <td className="py-2 text-center">{item.quantity}</td>
                          <td className="py-2 text-right">${item.unitPrice.toFixed(2)}</td>
                          <td className="py-2 text-right">${item.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Subtotal</span>
                      <span>${receipt.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Discount</span>
                      <span>${receipt.discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Tax</span>
                      <span>${receipt.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg mt-2 pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>${receipt.finalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Notes */}
                  {receipt.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="font-medium mb-1 flex items-center">
                        <Info className="h-4 w-4 mr-1" />
                        Notes
                      </h4>
                      <p className="text-gray-600">{receipt.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 flex items-center justify-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
                >
                  <Printer className="mr-2 h-5 w-5" />
                  Print Receipt
                </button>
                <button
                  onClick={handleDownloadReceipt}
                  className="flex-1 flex items-center justify-center py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
