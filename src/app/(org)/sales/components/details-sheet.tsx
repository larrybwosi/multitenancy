import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  ShoppingBag,
  User,
  DollarSign,
  Calendar,
  MapPin,
  CreditCard,
  Tag,
} from 'lucide-react';

// Mock data for demonstration
const mockSale = {
  id: 'S12345',
  customer: {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
  },
  items: [
    {
      variant: {
        name: 'Organic Cotton T-Shirt - Blue / L',
        sku: 'OCT-BL-L',
        retailPrice: 29.99,
        product: {
          imageUrls: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=100'],
          name: 'Organic Cotton T-Shirt',
        },
      },
      quantity: 2,
      price: 59.98,
    },
    {
      variant: {
        name: 'Premium Denim Jeans - Black / 32',
        sku: 'PDJ-BK-32',
        retailPrice: 89.99,
        product: {
          imageUrls: ['https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=100'],
          name: 'Premium Denim Jeans',
        },
      },
      quantity: 1,
      price: 89.99,
    },
  ],
  saleDate: new Date('2025-05-07T14:32:00'),
  totalAmount: { toString: () => '149.97' },
  discountAmount: { toString: () => '15.00' },
  taxAmount: { toString: () => '10.80' },
  finalAmount: { toString: () => '145.77' },
  paymentMethod: 'CREDIT_CARD',
  paymentStatus: 'PAID',
  locationId: 'Downtown Store',
  notes: 'Customer requested gift wrapping for t-shirts',
  cashDrawerId: 'CD-0023',
  receiptUrl: 'https://receipts.example.com/S12345',
  createdAt: new Date('2025-05-07T14:32:00'),
  updatedAt: new Date('2025-05-07T14:35:12'),
};

// Format currency
const formatCurrency = (amount: number | string) => {
  if (typeof amount === 'number') {
    return `$${amount.toFixed(2)}`;
  } else if (amount && typeof amount.toString === 'function') {
    return `$${amount.toString()}`;
  }
  return '$0.00';
};

// Format date
const formatDate = (date: Date) => {
  if (!date) return '';

  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(d);
};

// Badge component
const Badge = ({ type }:{type: string}) => {
  let bgColor = '';
  let textColor = '';

  switch (type) {
    case 'PAID':
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
      break;
    case 'PENDING':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-800';
      break;
    case 'REFUNDED':
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
      break;
    case 'CREDIT_CARD':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-800';
      break;
    case 'CASH':
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
      break;
    case 'MOBILE_PAYMENT':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      break;
    default:
      bgColor = 'bg-gray-100';
      textColor = 'text-gray-800';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {type.replace('_', ' ')}
    </span>
  );
};

const SaleSheet = ({ sale = mockSale }) => {
  const [isItemsOpen, setIsItemsOpen] = useState(true);
  const [isCustomerOpen, setIsCustomerOpen] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(true);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-3xl mx-auto border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-white text-xl font-bold">Sale #{sale.id}</h2>
          <p className="text-blue-100 text-sm flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(sale.saleDate)}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge type={sale.paymentStatus} />
          <div className="text-white font-bold text-xl">{formatCurrency(sale.finalAmount)}</div>
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-200">
        {/* Customer Section */}
        <div className="px-6 py-4">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setIsCustomerOpen(!isCustomerOpen)}
          >
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="font-medium text-gray-900">Customer Details</h3>
            </div>
            {isCustomerOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>

          {isCustomerOpen && sale.customer && (
            <div className="mt-3 ml-7 pl-2 border-l-2 border-gray-200">
              <p className="text-gray-900 font-medium">{sale.customer.name}</p>
              {sale.customer.email && <p className="text-gray-600 text-sm">{sale.customer.email}</p>}
            </div>
          )}
        </div>

        {/* Items Section */}
        <div className="px-6 py-4">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setIsItemsOpen(!isItemsOpen)}
          >
            <div className="flex items-center">
              <ShoppingBag className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="font-medium text-gray-900">Items</h3>
            </div>
            {isItemsOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>

          {isItemsOpen && sale.items && (
            <div className="mt-3 space-y-3">
              {sale.items.map((item, index) => (
                <div key={index} className="flex items-start p-2 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded overflow-hidden mr-4">
                    {item.variant.product.imageUrls && item.variant.product.imageUrls[0] ? (
                      <img
                        src="/api/placeholder/48/48"
                        alt={item.variant.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Tag className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.variant.product.name}</p>
                    <p className="text-xs text-gray-500 truncate">{item.variant.name}</p>
                    <p className="text-xs text-gray-500">SKU: {item.variant.sku}</p>
                  </div>
                  <div className="text-sm text-gray-900 text-right">
                    <div className="font-medium">{formatCurrency(item.price)}</div>
                    <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                    <div className="text-xs text-gray-500">{formatCurrency(item.variant.retailPrice)} ea.</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Section */}
        <div className="px-6 py-4">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => setIsPaymentOpen(!isPaymentOpen)}
          >
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="font-medium text-gray-900">Payment Details</h3>
            </div>
            {isPaymentOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </div>

          {isPaymentOpen && (
            <div className="mt-3 ml-7 pl-2 border-l-2 border-gray-200">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Subtotal</p>
                  <p className="text-sm text-gray-700">{formatCurrency(sale.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Discount</p>
                  <p className="text-sm text-gray-700">-{formatCurrency(sale.discountAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tax</p>
                  <p className="text-sm text-gray-700">{formatCurrency(sale.taxAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Total</p>
                  <p className="text-sm text-gray-900 font-bold">{formatCurrency(sale.finalAmount)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div>
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <div className="flex items-center mt-1">
                    <CreditCard className="h-4 w-4 text-gray-500 mr-1" />
                    <Badge type={sale.paymentMethod} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <Badge type={sale.paymentStatus} />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs text-gray-500">Location</p>
                <div className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                  <p className="text-sm text-gray-700">{sale.locationId}</p>
                </div>
              </div>

              {sale.notes && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-sm text-gray-700 mt-1 italic">{sale.notes}</p>
                </div>
              )}

              {sale.receiptUrl && (
                <div className="mt-4">
                  <a
                    href={sale.receiptUrl}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View Receipt
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500 flex justify-between">
          <span>Created: {formatDate(sale.createdAt)}</span>
          <span>Last Updated: {formatDate(sale.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
};

export default SaleSheet;
