// components/pos/Receipt.tsx
"use client";

import React from "react";
import { formatCurrency } from "@/lib/utils";
import { Customer } from "../types";
import { CalendarDays, Phone, Mail, CheckCircle2 } from "lucide-react";
import { PaymentMethod } from "@prisma/client";

interface ReceiptProps {
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    sku?: string;
  }[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  customer: Customer | null;
  date: Date;
  loyaltyDiscount?: number;
  pointsEarned?: number;
}

export function Receipt({
  items,
  subtotal,
  taxAmount,
  total,
  paymentMethod,
  customer,
  date,
}: ReceiptProps) {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm max-h-[70vh] overflow-auto">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">INVOICE</h2>
        <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-1">
          <CalendarDays size={14} className="text-blue-500" />
          <p>{date.toLocaleDateString()} {date.toLocaleTimeString()}</p>
        </div>
      </div>

      {customer && (
        <div className="mb-5 bg-blue-50 p-3 rounded-md border border-blue-100">
          <h3 className="font-medium text-gray-700 flex items-center gap-1 mb-1">
            <CheckCircle2 size={14} className="text-blue-600" />
            Customer
          </h3>
          <p className="text-gray-800 font-medium">{customer.name}</p>
          <div className="text-sm space-y-1 mt-1">
            {customer.email && (
              <p className="text-gray-600 flex items-center gap-1">
                <Mail size={12} className="text-gray-400" />
                {customer.email}
              </p>
            )}
            {customer.phone && (
              <p className="text-gray-600 flex items-center gap-1">
                <Phone size={12} className="text-gray-400" />
                {customer.phone}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="border border-gray-200 rounded-md overflow-hidden mb-4">
        <div className="grid grid-cols-12 gap-2 font-medium text-gray-700 text-sm p-2 bg-gray-50 border-b border-gray-200">
          <div className="col-span-6">Item</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Total</div>
        </div>

        <div className="divide-y divide-gray-100">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 text-sm p-2 hover:bg-gray-50 transition-colors">
              <div className="col-span-6">
                <p className="font-medium text-gray-800">{item.name}</p>
                {item.sku && <p className="text-xs text-gray-500 mt-0.5">{item.sku}</p>}
              </div>
              <div className="col-span-2 text-center">{item.quantity}</div>
              <div className="col-span-2 text-right text-gray-600">
                {formatCurrency(item.unitPrice)}
              </div>
              <div className="col-span-2 text-right font-medium text-gray-800">
                {formatCurrency(item.totalPrice)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-md border border-gray-200 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span className="text-gray-800">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax:</span>
          <span className="text-gray-800">{formatCurrency(taxAmount)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2">
          <span className="text-gray-800">Total:</span>
          <span className="text-blue-600">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Payment Method:</span>
          <span className="font-medium text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
            {paymentMethod.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">Thank you for your purchase!</p>
        <p className="mt-1 text-xs text-gray-400">Please come again</p>
      </div>
    </div>
  );
}
