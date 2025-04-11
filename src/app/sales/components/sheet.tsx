"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CreditCard, Package, Receipt, User } from "lucide-react";
import useSWR from "swr";
import { Customer, Sale } from "@prisma/client";

const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours() % 12 || 12;
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = date.getHours() >= 12 ? "PM" : "AM";

  return {
    date: `${month} ${day}, ${year}`,
    time: `${hours}:${minutes} ${ampm}`,
  };
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SaleWithCustomer extends Sale {
  customer?: Customer;
  items?: {
    product: {
      name: string;
      price: number;
      imageUrl?: string;
    };
    quantity: number;
    price: number;
  }[];
}

export function SaleDetailsSheet({
  saleId,
  onOpenChange,
}: {
  saleId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: saleDetails, isLoading } = useSWR<SaleWithCustomer>(
    saleId ? `/api/sales/${saleId}` : null,
    fetcher
  );

  // Format currency helper function
  const formatCurrency = (amount: number | null | undefined) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  return (
    <Sheet open={!!saleId} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto px-4">
        {isLoading ? (
          <div className="space-y-6">
            <SheetHeader className="pb-4 border-b">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-72 mt-2" />
            </SheetHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-20 w-full rounded-lg" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>

              <div>
                <Skeleton className="h-6 w-24 mb-3" />
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : saleDetails ? (
          <div className="space-y-6">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Sale #{saleDetails.saleNumber}
              </SheetTitle>
              <SheetDescription>
                View the complete details of this transaction
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              {/* Info cards */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                    <Calendar className="h-4 w-4" />
                    <h4>Date & Time</h4>
                  </div>
                  <p className="font-medium">
                    {formatDate(saleDetails.saleDate).date}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(saleDetails.saleDate).time}
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">
                    <User className="h-4 w-4" />
                    <h4>Customer</h4>
                  </div>
                  <p className="font-medium">
                    {saleDetails.customerId
                      ? saleDetails.customer?.name || "Customer"
                      : "Walk-in Customer"}
                  </p>
                  {saleDetails.customer?.email && (
                    <p className="text-sm text-muted-foreground truncate">
                      {saleDetails.customer.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
                    <CreditCard className="h-4 w-4" />
                    <h4>Payment Method</h4>
                  </div>
                  <p className="font-medium capitalize">
                    {saleDetails.paymentMethod.toLowerCase().replace("_", " ")}
                  </p>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800 shadow-sm">
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-2">
                    <h4>Status</h4>
                  </div>
                  <Badge
                    className="text-sm py-1"
                    variant={
                      saleDetails.paymentStatus === "COMPLETED"
                        ? "default"
                        : saleDetails.paymentStatus === "PENDING"
                          ? "secondary"
                          : saleDetails.paymentStatus === "FAILED" ||
                              saleDetails.paymentStatus === "CANCELLED"
                            ? "destructive"
                            : "outline"
                    }
                  >
                    {saleDetails.paymentStatus.charAt(0) +
                      saleDetails.paymentStatus.slice(1).toLowerCase()}
                  </Badge>
                </div>
              </div>

              {/* Items section */}
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-3">
                  <Package className="h-4 w-4" />
                  <h4>Items</h4>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg divide-y divide-indigo-100 dark:divide-indigo-800">
                  {/* Header */}
                  <div className="grid grid-cols-12 px-4 py-2 text-sm text-indigo-700 dark:text-indigo-300 font-medium bg-indigo-100 dark:bg-indigo-800/40 rounded-t-lg">
                    <div className="col-span-1"></div>
                    <div className="col-span-5">Product</div>
                    <div className="col-span-2 text-center">Price</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>

                  {/* Items */}
                  {saleDetails.items?.map((item, index) => (
                    <div
                      key={index}
                      className="p-4 grid grid-cols-12 items-center hover:bg-indigo-100/50 dark:hover:bg-indigo-800/20 transition-colors"
                    >
                      <div className="col-span-1">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="h-10 w-10 rounded-md object-cover border border-indigo-200 dark:border-indigo-700"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-800 dark:to-indigo-700 rounded-md flex items-center justify-center border border-indigo-200 dark:border-indigo-700">
                            <Package className="h-5 w-5 text-indigo-500 dark:text-indigo-300" />
                          </div>
                        )}
                      </div>
                      <div className="col-span-5">
                        <p className="font-medium">{item.product.name}</p>
                      </div>
                      <div className="col-span-2 text-center text-sm">
                        {formatCurrency(item.product.price)}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="inline-flex items-center justify-center min-w-8 h-6 px-2 rounded-full bg-indigo-200 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-200 text-sm font-medium">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="col-span-2 text-right font-medium">
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals section */}
              <div className="border-t border-pink-200 dark:border-pink-800 pt-4 mt-4">
                <div className="space-y-2 max-w-xs ml-auto bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg border border-pink-100 dark:border-pink-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-pink-600 dark:text-pink-400">
                      Subtotal
                    </span>
                    <span>{formatCurrency(saleDetails.subTotal)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-pink-600 dark:text-pink-400">
                      Tax
                    </span>
                    <span>{formatCurrency(saleDetails.taxAmount)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-pink-600 dark:text-pink-400">
                      Discount
                    </span>
                    <span>{formatCurrency(saleDetails.discountAmount)}</span>
                  </div>

                  <div className="flex justify-between font-medium pt-2 border-t border-pink-200 dark:border-pink-800">
                    <span className="text-pink-700 dark:text-pink-300">
                      Total
                    </span>
                    <span className="text-lg font-bold text-pink-700 dark:text-pink-300">
                      {formatCurrency(saleDetails.finalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
