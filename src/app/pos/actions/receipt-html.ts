
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
 * Customer interface represents a customer in the POS system
 */
export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}


export const generateReceiptHTML = (receipt: SaleResult | null) => {
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
