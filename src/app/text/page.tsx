// Example page/component where you use the table
import InvoiceTable from '@/components/inventory';
import React from 'react';

// Sample data mimicking the image
const sampleInvoices: InvoiceData[] = [
  { id: '1', invoiceNo: '102121', productName: '5 Star Quality Bed Set', supplierName: 'Ikea Store', purchaseDate: '03/12/2024', quantity: 500, price: 1500, totalAmount: 14000 },
  { id: '2', invoiceNo: '102120', productName: '2 Sofa Set', supplierName: 'Hatil Furniture', purchaseDate: '04/12/2024', quantity: 200, price: 1000, totalAmount: 20000 },
  { id: '3', invoiceNo: '102119', productName: 'Washroom Glass Set', supplierName: 'Bendor Sentry Shop', purchaseDate: '05/12/2024', quantity: 200, price: 500, totalAmount: 5000 },
  { id: '4', invoiceNo: '102118', productName: 'Hand Wash 100 Pices', supplierName: 'Bin Dawood Super', purchaseDate: '06/12/2024', quantity: 100, price: 3500, totalAmount: 14000 },
  { id: '5', invoiceNo: '102117', productName: '500 Set Tissue Box', supplierName: 'Kazis Store', purchaseDate: '07/12/2024', quantity: 455, price: 400, totalAmount: 12000 },
  { id: '6', invoiceNo: '102116', productName: 'Bed Set 4 Pax Use', supplierName: 'Bestbuy Furniture', purchaseDate: '08/12/2024', quantity: 344, price: 100, totalAmount: 10000 },
  { id: '7', invoiceNo: '102115', productName: 'Computer 4 Set', supplierName: 'Sky View Computer', purchaseDate: '09/12/2024', quantity: 988, price: 300, totalAmount: 19000 },
  { id: '8', invoiceNo: '102114', productName: 'Toilet Tissue 500 Ps', supplierName: 'Khans Store', purchaseDate: '10/12/2024', quantity: 15123, price: 100, totalAmount: 80000 },
  { id: '9', invoiceNo: '102113', productName: 'Hand Wash Set', supplierName: 'Bin Dawood Super', purchaseDate: '11/12/2024', quantity: 500, price: 1500, totalAmount: 14000 },
  { id: '10', invoiceNo: '102112', productName: 'Sofa Set Gray', supplierName: 'Ikea Store', purchaseDate: '12/12/2024', quantity: 433, price: 1600, totalAmount: 19000 },
];


function MyInvoicePage() {
  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen"> {/* Example page background */}
      <h1 className="text-xl font-semibold mb-4">Invoices</h1>
      <InvoiceTable data={sampleInvoices} />
    </div>
  );
}

export default MyInvoicePage;