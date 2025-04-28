// lib/receiptGenerator.ts
import { formatCurrency, formatDate } from "./utils"; // Adjust path
import { getBrowserInstance } from "./browser"; 
import { uploadSanityAsset } from "@/actions/uploads";
import { SaleWithDetails } from "@/actions/pos.actions";


/**
 * Generates HTML content for the receipt.
 */
function generateReceiptHtml(saleData: SaleWithDetails): string {
  // Basic inline styles - consider using CSS classes and a <style> tag for more complex styling
  const styles = {
    body: `font-family: 'Arial', sans-serif; font-size: 10px; line-height: 1.4; color: #333;`,
    header: `text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;`,
    logo: `font-size: 18px; font-weight: bold; margin-bottom: 5px;`,
    storeInfo: `font-size: 9px; color: #555;`,
    section: `margin-bottom: 10px;`,
    sectionTitle: `font-weight: bold; border-bottom: 1px solid #eee; margin-bottom: 5px; padding-bottom: 2px; font-size: 11px;`,
    table: `width: 100%; border-collapse: collapse;`,
    th: `text-align: left; border-bottom: 1px solid #ccc; padding: 4px 2px; font-weight: bold;`,
    td: `padding: 4px 2px; border-bottom: 1px solid #eee; vertical-align: top;`,
    totalRow: `font-weight: bold;`,
    textRight: `text-align: right;`,
    footer: `text-align: center; margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 10px; font-size: 9px; color: #777;`,
  };

  const itemsHtml = saleData.items
    .map(
      item => `
        <tr>
            <td style="${styles.td}">
                ${item.product.name} ${item.variant ? `(${item.variant.name})` : ''}<br/>
                <span style="font-size: 8px; color: #666;">SKU: ${item.variant?.sku || item.product.sku}</span>
            </td>
            <td style="${styles.td} ${styles.textRight}">${item.quantity}</td>
            <td style="${styles.td} ${styles.textRight}">${formatCurrency(item.unitPrice)}</td>
            <td style="${styles.td} ${styles.textRight}">${formatCurrency(item.totalAmount)}</td>
        </tr>
    `
    )
    .join('');

  return `
        <!DOCTYPE html>
        <html>
        <head><title>Receipt ${saleData.saleNumber}</title></head>
        <body style="${styles.body}">
            <div style="${styles.header}">
                <div style="${styles.logo}">Your Store Name</div>
                <div style="${styles.storeInfo}">
                    123 Market Street, Anytown, CA 98765<br/>
                    Phone: (555) 123-4567 | Website: yourstore.com
                </div>
            </div>

            <div style="${styles.section}">
                <div><strong>Receipt #:</strong> ${saleData.saleNumber}</div>
                <div><strong>Date:</strong> ${formatDate(saleData.saleDate, { dateStyle: 'medium', timeStyle: 'short' })}</div>
                <div><strong>Cashier:</strong> ${saleData.member.user?.name || 'N/A'}</div>
                ${saleData.customer ? `<div><strong>Customer:</strong> ${saleData.customer.name} ${saleData.customer.email ? `(${saleData.customer.email})` : ''}</div>` : ''}
            </div>

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

             <div style="${styles.section} ${styles.textRight}">
                <table style="width: 50%; margin-left: auto; border-collapse: collapse;">
                     <tr><td style="padding: 2px;">Subtotal:</td> <td style="padding: 2px;">${formatCurrency(saleData.totalAmount)}</td></tr>
                     ${saleData.discountAmount.greaterThan(0) ? `<tr><td style="padding: 2px;">Discount:</td> <td style="padding: 2px;">-${formatCurrency(saleData.discountAmount)}</td></tr>` : ''}
                     ${saleData.taxAmount.greaterThan(0) ? `<tr><td style="padding: 2px;">Tax:</td> <td style="padding: 2px;">${formatCurrency(saleData.taxAmount)}</td></tr>` : ''}
                     <tr style="${styles.totalRow} border-top: 1px solid #ccc;">
                         <td style="padding: 4px 2px;">Total:</td>
                         <td style="padding: 4px 2px;">${formatCurrency(saleData.finalAmount)}</td>
                     </tr>
                     <tr style="border-top: 1px solid #eee;">
                         <td style="padding: 2px;">Paid (${saleData.paymentMethod}):</td>
                         <td style="padding: 2px;">${formatCurrency(saleData.finalAmount)}</td> {/* Assuming paid amount matches final */}
                     </tr>
                 </table>
             </div>

            <div style="${styles.footer}">
                Thank you for your purchase!<br/>
                Questions? Contact us at support@yourstore.com
            </div>
        </body>
        </html>
    `;
}

/**
 * Generates PDF from HTML using Puppeteer and uploads to Sanity.
 * Returns the Sanity asset URL.
 */
export async function generateAndSaveReceiptPdf(saleData: SaleWithDetails): Promise<string> {
  let browser;
  try {
    const htmlContent = generateReceiptHtml(saleData);
    console.log('Generated HTML for receipt:', saleData.saleNumber);

    browser = await getBrowserInstance();
    const page = await browser.newPage();
    console.log('Puppeteer page created.');

    // Increase timeout if needed, especially for complex pages or slow connections
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 10000,
    }); // Wait for potential resources
    console.log('HTML content set on page.');

    // Generate PDF (adjust format as needed, e.g., width/height for thermal printers)
    const pdfBuffer = await page.pdf({
      // format: 'A4', // Standard page size
      width: '80mm', // Common thermal printer width
      printBackground: true,
      margin: { top: '10mm', right: '5mm', bottom: '10mm', left: '5mm' },
      timeout: 15000, // PDF generation timeout
    });
    console.log('PDF buffer generated, size:', pdfBuffer.length);

    await page.close();
    console.log('Puppeteer page closed.');

    // Define filename for Sanity
    const fileName = `receipt-${saleData.saleNumber}-${Date.now()}.pdf`;

    // Upload to Sanity
    console.log(`Uploading ${fileName} to Sanity...`);
    const receiptUrl = await uploadSanityAsset(
      //@ts-expect-error this is fine
      pdfBuffer,
      fileName,
      'application/pdf'
    );
    console.log('Receipt uploaded to Sanity:', receiptUrl);

    return receiptUrl;
  } catch (error) {
    console.error('Error during PDF generation or upload:', error);
    // Don't let receipt failure block the POS, but log it thoroughly
    // Consider implementing a retry mechanism or background job for failures
    throw new Error(`Failed to generate or save receipt: ${error}`);
  } finally {
    if (browser) {
      try {
        await browser.disconnect(); // Use disconnect for connect(), close() for launch()
        console.log('Puppeteer browser disconnected.');
      } catch (closeError) {
        console.error('Error disconnecting Puppeteer browser:', closeError);
      }
    }
  }
}
