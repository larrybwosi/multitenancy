'use server';

import puppeteer from 'puppeteer-core';
import writeXlsxFile from "write-excel-file";
import { CategoryWithStats } from '@/actions/category.actions';

export async function exportToPdf(data: CategoryWithStats[]) {
  try {
    const browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BLESS_TOKEN}`,
    });

    const page = await browser.newPage();
    
    // Create HTML content
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Categories Report</h1>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Parent</th>
                <th>Total Products</th>
                <th>Total Revenue</th>
                <th>Est. Profit</th>
                <th>Best Seller</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(category => `
                <tr>
                  <td>${category.name}</td>
                  <td>${category.description || '-'}</td>
                  <td>${category.parentName || '-'}</td>
                  <td>${category._count.products}</td>
                  <td>${formatCurrency(category.totalRevenue)}</td>
                  <td>${formatCurrency(category.potentialProfit)}</td>
                  <td>${category.bestSellingProduct ? `${category.bestSellingProduct.name} (${category.bestSellingProduct.totalSold})` : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();
    // const result = await client.assets.upload('file', pdf as Buffer, {
    //   filename: 'categories-report.pdf',
    //   contentType: 'application/pdf'
    // })
    // console.log(result);

    return pdf;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}



export async function exportToExcel(data: CategoryWithStats[]): Promise<void> {
  try {
    // Define schema/headers
    const schema = [
      {
        column: "Name",
        type: String,
        width: 20,
      },
      {
        column: "Description",
        type: String,
        width: 30,
      },
      {
        column: "Parent",
        type: String,
        width: 20,
      },
      {
        column: "Total Products",
        type: Number,
        width: 15,
      },
      {
        column: "Total Revenue",
        type: String,
        width: 15,
      },
      {
        column: "Est. Profit",
        type: String,
        width: 15,
      },
      {
        column: "Best Seller",
        type: String,
        width: 30,
      },
    ];

    // Prepare worksheet data as array of arrays
    const rows = data.map((category) => [
      // Name
      category.name,
      // Description
      category.description || "-",
      // Parent
      category.parentName || "-",
      // Total Products
      category._count.products,
      // Total Revenue
      formatCurrency(category.totalRevenue),
      // Est. Profit
      formatCurrency(category.potentialProfit),
      // Best Seller
      category.bestSellingProduct
        ? `${category.bestSellingProduct.name} (${category.bestSellingProduct.totalSold})`
        : "-",
    ]);

    // Write the Excel file
    await writeXlsxFile(rows, {
      schema,
      fileName: "categories-report.xlsx",
    });
  } catch (error) {
    console.error("Error generating Excel:", error);
    throw new Error("Failed to generate Excel file");
  }
}
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
} 