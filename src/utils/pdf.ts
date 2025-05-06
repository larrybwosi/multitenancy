import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { toast } from 'sonner';

/**
 * Generates HTML content for the receipt.
 */
/**
 * Enhanced Receipt Generator
 *
 * This function generates an attractive HTML receipt that receives business info from props
 * Compatible with TypeScript, React and Next.js applications
 */

// Define proper TypeScript interfaces
interface ProductVariant {
  name: string;
  sku: string;
}

interface Product {
  name: string;
  sku: string;
}

interface LineItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

interface Member {
  user?: {
    name: string;
  };
}

interface Customer {
  name: string;
  email?: string;
}

interface SaleData {
  saleNumber: string;
  saleDate: Date;
  member: Member;
  customer?: Customer | null;
  items: LineItem[];
  totalAmount: number;
  finalAmount: number;
  paymentMethod: string;
  tax?: number;
  discount?: number;
}

interface BusinessInfo {
  name: string;
  address: string;
  phone: string;
  website: string;
  email: string;
  logo?: string;
  tagline?: string;
  footerMessage?: string;
}

interface ReceiptProps {
  saleData: SaleData;
  currency: string;
  businessInfo: BusinessInfo;
  theme?: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  };
}

/**
 * Generate an attractive HTML receipt
 */
function generateReceiptHtml(props: ReceiptProps): string {
  const { saleData, currency, businessInfo } = props;

  // Default theme colors - keeping lighter colors better for thermal printing
  const theme = props.theme || {
    primary: '#000000', // Black for better thermal printing
    secondary: '#555555', // Dark gray
    text: '#000000', // Black text for thermal printing
    background: '#FFFFFF', // White background
  };

  // Media query for print
  const printStyles = `
    @media print {
      body {
        margin: 0;
        padding: 0 !important;
        width: 80mm; /* 80mm printer width */
      }
      .receipt {
        width: 72mm !important; /* Usable print area */
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
      .receipt-body {
        padding: 8px !important;
      }
      /* Optimize fonts for printing */
      * {
        font-family: 'Courier New', monospace !important;
      }
    }
  `;

  // Enhanced styles with responsive considerations for 80mm printers tofixed
  const styles = {
    receipt: `
      width: 100%;
      max-width: 384px; /* Common width for 80mm printers */
      margin: 0 auto;
      background: ${theme.background};
      color: ${theme.text};
      font-family: 'Courier New', monospace; /* Monospace font works better on thermal printers */
      overflow: hidden;
      /* Box shadow only for screen display, will be removed in print */
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    `,
    header: `
      background: ${theme.background};
      border-bottom: 2px dashed ${theme.secondary};
      color: ${theme.primary};
      padding: 10px 8px;
      text-align: center;
    `,
    logo: `
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 4px;
      letter-spacing: -0.5px;
    `,
    storeInfo: `
      font-size: 9px;
      color: ${theme.text};
      margin-bottom: 4px;
    `,
    receiptBody: `
      padding: 8px;
    `,
    section: `
      margin-bottom: 10px;
    `,
    sectionTitle: `
      font-weight: 600;
      border-bottom: 1px solid ${theme.secondary};
      margin-bottom: 6px;
      padding-bottom: 3px;
      font-size: 12px;
      color: ${theme.primary};
    `,
    table: `
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    `,
    th: `
      text-align: left;
      padding: 4px 2px;
      font-weight: 600;
      color: ${theme.secondary};
      border-bottom: 1px dashed #aaa;
    `,
    td: `
      padding: 5px 2px;
      border-bottom: 1px solid #eee;
      vertical-align: top;
      font-size: 10px;
    `,
    productName: `
      font-weight: 500;
      font-size: 10px;
    `,
    productSku: `
      font-size: 8px;
      color: ${theme.secondary};
      margin-top: 2px;
    `,
    textRight: `
      text-align: right;
    `,
    totalsTable: `
      width: 100%;
      margin-top: 10px;
      border-collapse: collapse;
    `,
    totalsRow: `
      font-size: 10px;
    `,
    totalLabel: `
      text-align: right;
      padding: 3px;
      color: ${theme.secondary};
    `,
    totalValue: `
      text-align: right;
      padding: 3px;
      font-weight: 500;
    `,
    grandTotal: `
      font-weight: 700;
      font-size: 12px;
      color: ${theme.primary};
      border-top: 1px dashed #aaa;
      padding-top: 5px;
    `,
    paymentInfo: `
      background: #f9f9f9;
      padding: 6px;
      margin-top: 8px;
      font-size: 10px;
    `,
    meta: `
      margin-bottom: 8px;
      font-size: 10px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
    `,
    metaLabel: `
      color: ${theme.secondary};
      font-size: 9px;
    `,
    footer: `
      text-align: center;
      margin-top: 10px;
      padding: 10px 5px;
      border-top: 1px dashed #aaa;
      font-size: 9px;
      color: ${theme.secondary};
    `,
    barcode: `
      margin-top: 8px;
      text-align: center;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      letter-spacing: 1px;
    `,
  };

  // Helper function to format dates (assuming it was defined elsewhere in the original code)
  function formatDate(date: string | Date, options: Intl.DateTimeFormatOptions): string {
    return new Date(date).toLocaleString(undefined, options);
  }

  // Generate items HTML with condensed formatting for 80mm width
  const itemsHtml = saleData.items
    .map(
      (item: LineItem) => `
        <tr>
          <td style="${styles.td}">
            <div style="${styles.productName}">${item.product.name} ${
              item.variant ? `(${item.variant.name})` : ''
            }</div>
            <div style="${styles.productSku}">SKU: ${item.variant?.sku || item.product.sku}</div>
          </td>
          <td style="${styles.td} ${styles.textRight}">${item.quantity}</td>
          <td style="${styles.td} ${styles.textRight}">${currency}${item.unitPrice}</td>
          <td style="${styles.td} ${styles.textRight}">${currency}${item.totalAmount}</td>
        </tr>
      `
    )
    .join('');

  // Generate HTML for the receipt with responsive considerations
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt ${saleData.saleNumber}</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        ${printStyles}
        @page {
          size: 80mm auto; /* Width of 80mm, height auto */
          margin: 0;
        }
        body {
          margin: 0;
          padding: 10px;
          background: #f5f5f5;
        }
        @media screen and (max-width: 400px) {
          body {
            padding: 0;
            background: #ffffff;
          }
          .receipt {
            box-shadow: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt" style="${styles.receipt}">
        <!-- Header -->
        <div style="${styles.header}">
          ${
            businessInfo.logo
              ? `<img src="${businessInfo.logo}" alt="${businessInfo.name}" style="max-width: 100px; max-height: 40px; margin-bottom: 8px;">`
              : `<div style="${styles.logo}">${businessInfo.name}</div>`
          }
          <div style="${styles.storeInfo}">
            ${businessInfo.address}<br/>
            ${businessInfo.phone} | ${businessInfo.website}
          </div>
          ${
            businessInfo.tagline
              ? `<div style="font-style: italic; margin-top: 3px; font-size: 9px;">${businessInfo.tagline}</div>`
              : ''
          }
        </div>
        
        <!-- Receipt Body -->
        <div class="receipt-body" style="${styles.receiptBody}">
          <!-- Receipt Meta Info -->
          <div style="${styles.meta}">
            <div>
              <div style="${styles.metaLabel}">RECEIPT</div>
              <div style="font-weight: 600;">#${saleData.saleNumber}</div>
            </div>
            <div>
              <div style="${styles.metaLabel}">DATE</div>
              <div>${formatDate(saleData.saleDate, {
                dateStyle: 'short',
              })}</div>
            </div>
            <div>
              <div style="${styles.metaLabel}">TIME</div>
              <div>${formatDate(saleData.saleDate, {
                timeStyle: 'short',
              })}</div>
            </div>
            <div>
              <div style="${styles.metaLabel}">CASHIER</div>
              <div>${saleData.member.user?.name || 'N/A'}</div>
            </div>
            ${
              saleData.customer
                ? `
            <div style="grid-column: span 2;">
              <div style="${styles.metaLabel}">CUSTOMER</div>
              <div>${saleData.customer.name} ${
                saleData.customer.email ? `<span style="font-size: 8px;">(${saleData.customer.email})</span>` : ''
              }</div>
            </div>
            `
                : ''
            }
          </div>

          <!-- Items Section -->
          <div style="${styles.section}">
            <div style="${styles.sectionTitle}">Items</div>
            <table style="${styles.table}">
              <thead>
                <tr>
                  <th style="${styles.th}">Item</th>
                  <th style="${styles.th} ${styles.textRight}">Qty</th>
                  <th style="${styles.th} ${styles.textRight}">Price</th>
                  <th style="${styles.th} ${styles.textRight}">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Totals Section -->
          <div style="${styles.section}">
            <table style="${styles.totalsTable}">
              <tr style="${styles.totalsRow}">
                <td style="${styles.totalLabel}">Subtotal:</td>
                <td style="${styles.totalValue}">${currency}${saleData?.totalAmount}</td>
              </tr>
              ${
                saleData.tax
                  ? `
              <tr style="${styles.totalsRow}">
                <td style="${styles.totalLabel}">Tax:</td>
                <td style="${styles.totalValue}">${currency}${saleData?.tax}</td>
              </tr>
              `
                  : ''
              }
              ${
                saleData.discount
                  ? `
              <tr style="${styles.totalsRow}">
                <td style="${styles.totalLabel}">Discount:</td>
                <td style="${styles.totalValue}">- ${currency}${saleData.discount}</td>
              </tr>
              `
                  : ''
              }
              <tr>
                <td style="${styles.totalLabel} ${styles.grandTotal}">Total:</td>
                <td style="${styles.totalValue} ${styles.grandTotal}">${currency}${saleData?.finalAmount}</td>
              </tr>
            </table>
          </div>

          <!-- Payment Info -->
          <div style="${styles.paymentInfo}">
            <div><strong>Payment Method:</strong> ${saleData.paymentMethod}</div>
            <div><strong>Amount Paid:</strong> ${currency}${saleData.finalAmount}</div>
            <div><strong>Date:</strong> ${formatDate(saleData.saleDate, {
              dateStyle: 'medium',
            })}</div>
          </div>

          <!-- Barcode -->
          <div style="${styles.barcode}">
            *${saleData.saleNumber}*
          </div>
        </div>

        <!-- Footer -->
        <div style="${styles.footer}">
          ${businessInfo.footerMessage || `Thank you for your purchase!`}<br/>
          Questions? Contact us at ${businessInfo.email}
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Format a date with options
 * @param date The date to format
 * @param options Date formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Generates PDF from HTML using Puppeteer and uploads to Sanity.
 * Returns the Sanity asset URL.
 */
export async function generateAndSaveReceiptPdf(saleResponseData: SaleData): Promise<Blob> {
  try {
    const businessInfo: BusinessInfo = {
      name: 'Dealio Inc',
      address: '123 Main St, City, Country',
      phone: '+1234567890',
      website: 'www.dealioinc.com',
      email: 'info@dealioinc.com',
      logo: 'https://i.pinimg.com/736x/af/63/0d/af630de0e36a6ebb056478328941a175.jpg',
      tagline: 'Quality products at affordable prices',
      footerMessage: 'Thank you for shopping with us!',
    };

    const receiptProps = convertToReceiptProps(saleResponseData, businessInfo, 'USD', {
      primary: '#4f46e5',
      secondary: '#818cf8',
      text: '#1f2937',
      background: '#ffffff',
    });

    // Create temporary element
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-9999px'; // Hide off-screen
    element.style.width = '300px'; // Match html2canvas width
    element.innerHTML = generateReceiptHtml(receiptProps);
    document.body.appendChild(element);

    // Wait for images to load
    await new Promise(resolve => {
      const images = element.getElementsByTagName('img');
      let loaded = 0;

      if (images.length === 0) {
        resolve(true);
        return;
      }

      Array.from(images).forEach(img => {
        img.onload = () => {
          loaded++;
          if (loaded === images.length) resolve(true);
        };
        img.onerror = () => {
          loaded++; // Continue even if some images fail to load
          if (loaded === images.length) resolve(true);
        };
      });
    });

    const canvas = await html2canvas(element, {
      width: 300, // 80mm ≈ 300px
      scale: 2,
      useCORS: true,
      logging: true, // Helpful for debugging
      allowTaint: true, // Allows cross-origin images to be tainted
    });

    // Clean up
    document.body.removeChild(element);

    const pdf = new jsPDF({
      unit: 'mm',
      format: [80, (canvas.height * 80) / canvas.width],
      orientation: 'portrait',
    });

    pdf.addImage(
      canvas.toDataURL('image/png', 1.0), // Highest quality
      'PNG',
      0,
      0,
      80,
      (canvas.height * 80) / canvas.width
    );

    // Save a copy for immediate download
    // pdf.save(`receipt_${receiptProps.saleData.saleNumber}.pdf`);

    // Return the blob
    return pdf.output('blob');
  } catch (error) {
    console.error('Error during PDF generation:', error);
    toast.error('Error during PDF generation', {
      duration: 5000,
      description: `${error instanceof Error ? error.message : String(error)}`,
    });
  }
}


/**
 * Converts sale response data into the required ReceiptProps format
 */
export const convertToReceiptProps = (
  saleResponse: any,
  businessInfo: BusinessInfo,
  currency: string,
  theme?: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
  }
): ReceiptProps => {
  // Extract sale data
  const saleData: SaleData = {
    saleNumber: saleResponse.saleNumber,
    saleDate: new Date(saleResponse.saleDate),
    member: {
      user: saleResponse.member?.user
        ? {
            name: saleResponse.member.user.name,
          }
        : undefined,
    },
    customer: saleResponse.customer
      ? {
          name: saleResponse.customer.name,
          email: saleResponse.customer.email,
        }
      : undefined,
    items: saleResponse.items.map((item: any): LineItem => {
      const product: Product = {
        name: item.variant?.product?.name || '',
        sku: item.variant?.product?.sku || '',
      };

      const variant: ProductVariant | undefined = item.variant
        ? {
            name: item.variant.name,
            sku: item.variant.sku,
          }
        : undefined;

      return {
        product,
        variant,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalAmount: Number(item.totalAmount),
      };
    }),
    totalAmount: Number(saleResponse.totalAmount),
    finalAmount: Number(saleResponse.finalAmount),
    paymentMethod: saleResponse.paymentMethod,
    tax: saleResponse.taxAmount ? Number(saleResponse.taxAmount) : undefined,
    discount: saleResponse.discountAmount ? Number(saleResponse.discountAmount) : undefined,
  };

  // Return complete ReceiptProps object
  return {
    saleData,
    currency,
    businessInfo,
    theme,
  };
};

// Interface definitions
interface ProductVariant {
  name: string;
  sku: string;
}

interface Product {
  name: string;
  sku: string;
}

interface LineItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

// Example usage:
/*
const businessInfo: BusinessInfo = {
  name: "Dealio Inc",
  address: "123 Main St, City, Country",
  phone: "+1234567890",
  website: "www.dealioinc.com",
  email: "info@dealioinc.com",
  logo: "https://i.pinimg.com/736x/af/63/0d/af630de0e36a6ebb056478328941a175.jpg",
  tagline: "Quality products at affordable prices",
  footerMessage: "Thank you for shopping with us!"
};

const receiptProps = convertToReceiptProps(saleResponseData, businessInfo, "USD", {
  primary: "#4f46e5",
  secondary: "#818cf8",
  text: "#1f2937",
  background: "#ffffff"
});
*/
