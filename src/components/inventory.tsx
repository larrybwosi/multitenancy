// src/components/InvoiceTable.tsx
'use client'; // If using Next.js App Router

import React, { useState } from 'react';
import {
  MoreHorizontal,
  Star,
  Sofa,
  GlassWater,
  Hand,
  Box,
  Bed,
  Monitor,
  Package, // Using 'Package' for Toilet Tissue
} from 'lucide-react';

export interface InvoiceData {
  id: string; // Unique identifier for keys and selection
  invoiceNo: string;
  productName: string;
  productIcon?: React.ReactNode; // Component for the icon (e.g., <Star size={16} />)
  supplierName: string;
  purchaseDate: string; // Keep as string for simplicity, format as needed
  quantity: number;
  price: number;
  totalAmount: number;
}

interface InvoiceTableProps {
  data: InvoiceData[];
}

// Helper to format currency (example)
const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    // Basic example, use a library like 'intl' for robust formatting
    // return `$${amount.toFixed(2)}`; // Simpler alternative if locale isn't critical
    // The image uses whole numbers for some prices ($500), adjust formatting if needed:
    // return `$${amount.toLocaleString('en-US')}`;
};

// Map product names (or types) to icons - adjust logic as needed
const getProductIcon = (productName: string): React.ReactNode => {
    const lowerName = productName.toLowerCase();
    if (lowerName.includes('bed set')) return <Star size={16} className="text-yellow-500" />; // Assuming star means quality
    if (lowerName.includes('sofa set')) return <Sofa size={16} className="text-purple-500" />;
    if (lowerName.includes('washroom glass')) return <GlassWater size={16} className="text-blue-500" />;
    if (lowerName.includes('hand wash')) return <Hand size={16} className="text-green-500" />;
    if (lowerName.includes('tissue box')) return <Box size={16} className="text-orange-500" />;
    if (lowerName.includes('bed set 4 pax')) return <Bed size={16} className="text-red-500" />; // Another bed icon
    if (lowerName.includes('computer')) return <Monitor size={16} className="text-gray-500" />;
    if (lowerName.includes('toilet tissue')) return <Package size={16} className="text-cyan-500" />; // Package for tissues
    if (lowerName.includes('sofa set gray')) return <Sofa size={16} className="text-gray-500" />; // Different color sofa

    return null; // Default no icon
};


const InvoiceTable: React.FC<InvoiceTableProps> = ({ data }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(new Set(data.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prevSelectedIds) => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id);
      } else {
        newSelectedIds.add(id);
      }
      return newSelectedIds;
    });
  };

  const isAllSelected = data.length > 0 && selectedIds.size === data.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < data.length;

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-neutral-200/60"> {/* Added container for potential scroll, bg, border, shadow */}
      <table className="w-full text-sm text-left text-neutral-600">
        <thead className="text-xs text-neutral-500 uppercase bg-white">
          <tr>
            {/* Checkbox Header */}
            <th scope="col" className="p-4 w-4">
              <div className="flex items-center">
                <input
                  id="checkbox-all"
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-neutral-100 border-neutral-300 rounded focus:ring-blue-500 focus:ring-2"
                  checked={isAllSelected}
                  ref={input => { // Handle indeterminate state
                      if (input) {
                          input.indeterminate = isIndeterminate;
                      }
                  }}
                  onChange={handleSelectAll}
                />
                <label htmlFor="checkbox-all" className="sr-only">Select all items</label>
              </div>
            </th>
            {/* Other Headers */}
            <th scope="col" className="py-3 px-5 font-medium">Invoice No</th>
            <th scope="col" className="py-3 px-5 font-medium">Name of Product</th>
            <th scope="col" className="py-3 px-5 font-medium">Supplier Name</th>
            <th scope="col" className="py-3 px-5 font-medium">Purchase Date</th>
            <th scope="col" className="py-3 px-5 font-medium text-right">Quantity</th>
            <th scope="col" className="py-3 px-5 font-medium text-right">Price</th>
            <th scope="col" className="py-3 px-5 font-medium text-right">Total Amount</th>
            <th scope="col" className="py-3 px-5 font-medium"><span className="sr-only">Actions</span></th> {/* Actions column */}
          </tr>
        </thead>
        <tbody className='divide-y divide-neutral-200/60'> {/* Subtle divider */}
          {data.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const icon = item.productIcon ?? getProductIcon(item.productName); // Use provided icon or generate one
            return (
              <tr key={item.id} className={`bg-white hover:bg-neutral-50/70 ${isSelected ? 'bg-neutral-50' : ''}`}>
                {/* Checkbox Cell */}
                <td className="p-4 w-4">
                  <div className="flex items-center">
                    <input
                      id={`checkbox-${item.id}`}
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-neutral-100 border-neutral-300 rounded focus:ring-blue-500 focus:ring-2"
                      checked={isSelected}
                      onChange={() => handleSelectRow(item.id)}
                    />
                    <label htmlFor={`checkbox-${item.id}`} className="sr-only">Select item {item.invoiceNo}</label>
                  </div>
                </td>
                {/* Data Cells */}
                <td className="py-3 px-5 font-medium text-neutral-900 whitespace-nowrap">
                  #{item.invoiceNo}
                </td>
                <td className="py-3 px-5">
                   <div className="flex items-center gap-2"> {/* Use gap for spacing */}
                      {icon && <span className="flex-shrink-0">{icon}</span>}
                      <span className="font-medium text-neutral-700 truncate">{item.productName}</span> {/* Added truncate */}
                    </div>
                </td>
                <td className="py-3 px-5 text-neutral-600">{item.supplierName}</td>
                <td className="py-3 px-5 text-neutral-600">{item.purchaseDate}</td>
                <td className="py-3 px-5 text-right text-neutral-600">{item.quantity.toLocaleString('en-US')}</td>
                <td className="py-3 px-5 text-right text-neutral-600">{formatCurrency(item.price)}</td>
                <td className="py-3 px-5 text-right font-bold text-neutral-900">{formatCurrency(item.totalAmount)}</td>
                {/* Actions Cell */}
                <td className="py-3 px-5 text-right">
                   <button className="text-neutral-400 hover:text-neutral-600">
                      <MoreHorizontal size={18} />
                      <span className="sr-only">More options for {item.invoiceNo}</span>
                   </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.length === 0 && (
          <div className="text-center py-10 text-neutral-500">No data available.</div>
      )}
    </div>
  );
};

export default InvoiceTable;