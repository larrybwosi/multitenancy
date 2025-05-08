/**
 * Interface for invoice item
 */
interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Interface for company information
 */
interface CompanyInfo {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

/**
 * Interface for client information
 */
interface ClientInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

/**
 * Interface for invoice data
 */
interface InvoiceData {
  company: CompanyInfo;
  client: ClientInfo;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  vatRate: number;
  termsText: string;
  currency: string;
  locale: string;
}

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - The currency code (e.g., 'GBP', 'USD', 'EUR')
 * @param locale - The locale to use for formatting (e.g., 'en-GB', 'en-US', 'fr-FR')
 * @returns Formatted currency string
 */
function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date according to locale
 * @param date - The date to format
 * @param locale - The locale to use for formatting
 * @returns Formatted date string
 */
function formatDate(date: Date, locale: string): string {
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  return date.toLocaleDateString(locale, options).toUpperCase();
}

/**
 * Generate an invoice HTML based on provided data
 * @param data - The invoice data
 * @returns HTML string representing the invoice
 */
export function generateInvoiceHtml(data: InvoiceData): string {
  // Calculate totals
  const subtotalValue = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const vatValue = subtotalValue * (data.vatRate / 100);
  const totalValue = subtotalValue + vatValue;

  // Format currency values
  const subtotal = formatCurrency(subtotalValue, data.currency, data.locale);
  const vatAmount = formatCurrency(vatValue, data.currency, data.locale);
  const totalAmount = formatCurrency(totalValue, data.currency, data.locale);

  // Generate invoice items HTML
  const invoiceItems = data.items
    .map(item => {
      const itemTotal = item.quantity * item.unitPrice;
      return `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity.toString().padStart(2, '0')}</td>
        <td>${formatCurrency(item.unitPrice, data.currency, data.locale)}</td>
        <td>${formatCurrency(itemTotal, data.currency, data.locale)}</td>
      </tr>
    `;
    })
    .join('');

  // Format dates
  const invoiceDate = formatDate(data.invoiceDate, data.locale);
  const dueDate = formatDate(data.dueDate, data.locale);

  // Return the template with all values replaced
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.company.name} - Invoice ${data.invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
        body {
            background-color: #f5f5f5;
            padding: 20px;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: #fff;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .invoice-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
        }
        .company-info {
            color: #666;
            font-size: 14px;
        }
        .company-info h2 {
            color: #333;
            margin-bottom: 5px;
            font-size: 20px;
        }
        .invoice-title {
            font-size: 40px;
            color: #333;
            text-align: right;
            margin-top: 20px;
        }
        .invoice-details {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
        }
        .client-info h3 {
            font-size: 16px;
            margin-bottom: 5px;
            color: #666;
        }
        .client-info p {
            font-size: 14px;
            color: #666;
            line-height: 1.4;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .invoice-info-item span:first-child {
            font-weight: bold;
            margin-right: 20px;
        }
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
        }
        .invoice-table th {
            background-color: #333;
            color: #fff;
            padding: 10px;
            text-align: left;
        }
        .invoice-table th:last-child, 
        .invoice-table td:last-child {
            text-align: right;
        }
        .invoice-table td {
            padding: 15px 10px;
            border-bottom: 1px solid #eee;
        }
        .invoice-summary {
            padding: 20px;
            text-align: right;
        }
        .invoice-summary-item {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 10px;
        }
        .invoice-summary-item span:first-child {
            margin-right: 100px;
            font-weight: normal;
        }
        .invoice-summary-item.total {
            background-color: #333;
            color: #fff;
            padding: 10px;
            margin-top: 10px;
        }
        .payment-info {
            padding: 20px;
            border-top: 1px solid #eee;
        }
        .payment-info h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #333;
        }
        .payment-details p {
            margin-bottom: 5px;
            font-size: 14px;
        }
        .terms {
            padding: 20px;
            border-top: 1px solid #eee;
        }
        .terms h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #333;
        }
        .terms p {
            font-size: 14px;
            color: #666;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <div class="company-info">
                <h2>${data.company.name}</h2>
                <p>${data.company.tagline}</p>
            </div>
            <div class="company-contact">
                <p>${data.company.phone}</p>
                <p>${data.company.email}</p>
                <p>${data.company.website}</p>
            </div>
        </div>
        
        <div class="invoice-details">
            <div class="client-info">
                <h3>INVOICE TO</h3>
                <p>${data.client.name}</p>
                <p>${data.client.phone}</p>
                <p>${data.client.email}</p>
                <p>${data.client.address}</p>
            </div>
            <div class="invoice-title">
                INVOICE
            </div>
        </div>
        
        <div class="invoice-info">
            <div class="invoice-info-item">
                <span>INVOICE NUMBER:</span>
                <span>${data.invoiceNumber}</span>
            </div>
            <div class="invoice-info-item">
                <span>INVOICE DATE:</span>
                <span>${invoiceDate}</span>
            </div>
            <div class="invoice-info-item">
                <span>DUE DATE:</span>
                <span>${dueDate}</span>
            </div>
        </div>
        
        <table class="invoice-table">
            <thead>
                <tr>
                    <th>ITEMS</th>
                    <th>QUANTITY</th>
                    <th>UNIT PRICE</th>
                    <th>TOTAL</th>
                </tr>
            </thead>
            <tbody>
                ${invoiceItems}
            </tbody>
        </table>
        
        <div class="invoice-summary">
            <div class="invoice-summary-item">
                <span>Subtotal</span>
                <span>${subtotal}</span>
            </div>
            <div class="invoice-summary-item">
                <span>VAT (${data.vatRate}%)</span>
                <span>${vatAmount}</span>
            </div>
            <div class="invoice-summary-item total">
                <span>TOTAL</span>
                <span>${totalAmount}</span>
            </div>
        </div>
        
        <div class="payment-info">
            <h3>PAYMENT METHOD</h3>
            <div class="payment-details">
                <p><strong>BANK NAME:</strong> <span>${data.company.bankName}</span></p>
                <p><strong>ACCOUNT NAME:</strong> <span>${data.company.accountName}</span></p>
                <p><strong>ACCOUNT NUMBER:</strong> <span>${data.company.accountNumber}</span></p>
            </div>
        </div>
        
        <div class="terms">
            <h3>TERMS AND CONDITIONS</h3>
            <p>${data.termsText}</p>
        </div>
    </div>
</body>
</html>`;
}

/**
 * Example usage
 */
/* 
// Example usage:
const invoiceData: InvoiceData = {
  company: {
    name: 'TRANQUIL & CO',
    tagline: 'FURNITURE MANUFACTURE',
    phone: '0161 234 5678',
    email: 'TRANQUIL.CO@EMAIL.SITE.CO.UK',
    website: 'TRANQUIL.CO.SITE.CO.UK',
    bankName: 'SALSA SOIREE BANK',
    accountName: 'TRANQUIL COMPANY',
    accountNumber: '555-555-555'
  },
  client: {
    name: 'JENNIFER CLARK',
    phone: '07700 900123',
    email: 'jenniferclark@email.site.co.uk',
    address: '123 Main Street, London, SW1A 1AA'
  },
  invoiceNumber: '123-456',
  invoiceDate: new Date('2023-04-11'),
  dueDate: new Date('2023-04-18'),
  items: [
    { name: 'Custom Cream Sofa', quantity: 2, unitPrice: 750 },
    { name: 'Oak Dining Table', quantity: 1, unitPrice: 1200 },
    { name: 'Lounge Armchairs', quantity: 4, unitPrice: 400 },
    { name: 'Delivery & Installation', quantity: 1, unitPrice: 250 }
  ],
  vatRate: 20,
  termsText: 'Payment is due within 30 days of the invoice date unless otherwise agreed upon in writing. Late payments will incur a late fee of 2.5% per month on the outstanding balance.',
  currency: 'GBP',
  locale: 'en-GB'
};

const htmlOutput = generateInvoiceHtml(invoiceData);
*/
