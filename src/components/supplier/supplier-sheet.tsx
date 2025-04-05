"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Supplier } from "@prisma/client";
import { toast } from "sonner";
import { 
  DollarSign, 
  Mail, 
  MapPin, 
  MoreVertical, 
  Phone, 
  User, 
  PackageOpen,
  Calendar,
  Building,
  ArrowUpDown
} from "lucide-react";
import { getSupplierHistory } from "@/actions/supplier";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";

// SWR fetcher function
const fetcher = async (args: string[]) => {
  const [_, orgId, supplierId] = args;
  const result = await getSupplierHistory(orgId, supplierId);
  
  if (!result) {
    throw new Error("Failed to fetch transactions.");
  }
  
  return result.items.map((item) => ({
    id: item.stockId,
    date: item.transactionDate?.toISOString() || new Date().toISOString(),
    productName: item.productName,
    quantity: item.quantityPurchased,
    unitPrice: item.buyingPricePerUnit,
    total: item.totalBuyingPrice,
    status: "completed" as const,
  }));
};

export default function SupplierSheet({
  supplier,
  onOpenChange,
}: {
  supplier: Supplier;
  onOpenChange?: (open: boolean) => void;
}) {
  const ORGANISATION_ID = "r9UlQeTQL9UN0EVV8YOLTY7eRcTYnEu5";
  
  // Using SWR instead of useEffect
  const { data: transactions, error, isLoading } = useSWR(
    supplier ? ['supplier-history', ORGANISATION_ID, supplier.id] : null,
    fetcher,
    {
      onError: (err) => {
        toast.error("Error loading transactions", {
          description: err instanceof Error ? err.message : "An unknown error occurred",
        });
      },
      revalidateOnFocus: false,
    }
  );

  // Get supplier initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Format date
  const formatDate = (dateString: string, format: "short" | "long" = "long") => {
    const date = new Date(dateString);
    if (format === "short") {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Sheet onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
        >
          <span className="sr-only">Open details</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl p-0 shadow-xl border-l border-indigo-100">
        <ScrollArea className="h-full pr-0">
          <div className="flex-1">
            {/* Supplier Header - Hero Section */}
            <div className="relative overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-36"></div>
              <div className="px-6 pb-5 pt-4 relative">
                <div className="flex items-start gap-5 -mt-14">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg bg-white">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold">
                      {getInitials(supplier.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 pt-3">
                    <SheetTitle className="text-2xl font-bold tracking-tight text-gray-800">
                      {supplier.name}
                    </SheetTitle>
                    <div className="flex items-center text-sm text-gray-500">
                      <Building className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
                      Supplier since {formatDate(supplier.createdAt.toString())}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 px-6 mb-8">
              <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-16 h-16 -mt-5 -mr-5 rounded-full bg-indigo-200 opacity-30"></div>
                <CardHeader className="pb-2 pt-4">
                  <p className="text-sm font-medium text-indigo-700 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1.5 text-indigo-600" />
                    Total Spent
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatCurrency(supplier?.totalSpent || 0)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-pink-50 to-rose-50 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-16 h-16 -mt-5 -mr-5 rounded-full bg-pink-200 opacity-30"></div>
                <CardHeader className="pb-2 pt-4">
                  <p className="text-sm font-medium text-pink-700 flex items-center">
                    <Calendar className="h-4 w-4 mr-1.5 text-pink-600" />
                    Last Order
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-800">
                    {supplier.lastOrderDate
                      ? formatDate(supplier.lastOrderDate.toString(), "short")
                      : "No orders"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-4 px-6 mb-8">
              <h3 className="text-lg font-semibold flex items-center text-gray-800">
                <User className="h-5 w-5 mr-2 text-indigo-500" />
                Contact Information
              </h3>
              <Card className="border border-indigo-50 shadow-sm overflow-hidden">
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-indigo-600 flex items-center">
                        <User className="h-3.5 w-3.5 mr-1.5" />
                        Contact Person
                      </p>
                      <p className="font-medium text-gray-800">
                        {supplier.contactPerson ? (
                          supplier.contactPerson
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            Not specified
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-indigo-600 flex items-center">
                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                        Email
                      </p>
                      <p className="font-medium">
                        {supplier.email ? (
                          <a
                            href={`mailto:${supplier.email}`}
                            className="text-indigo-600 hover:underline hover:text-indigo-700 transition-colors"
                          >
                            {supplier.email}
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            Not specified
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-indigo-600 flex items-center">
                        <Phone className="h-3.5 w-3.5 mr-1.5" />
                        Phone
                      </p>
                      <p className="font-medium">
                        {supplier.phone ? (
                          <a
                            href={`tel:${supplier.phone}`}
                            className="text-gray-800 hover:text-indigo-700 hover:underline transition-colors"
                          >
                            {supplier.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            Not specified
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-indigo-600 flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1.5" />
                        Address
                      </p>
                      <p className="font-medium text-gray-800">
                        {supplier.address ? (
                          supplier.address
                        ) : (
                          <span className="text-gray-400 text-sm italic">
                            Not specified
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-6 bg-indigo-100" />

            {/* Recent Transactions */}
            <div className="space-y-4 px-6 pb-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center text-gray-800">
                  <PackageOpen className="h-5 w-5 mr-2 text-indigo-500" />
                  Transaction History
                </h3>
                {transactions && transactions.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-3 py-1.5 font-medium"
                  >
                    {transactions.length} transactions
                  </Badge>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="border-0 shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-8 w-20 rounded-md" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <Card className="border border-rose-100 bg-rose-50/50">
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                    <p className="text-rose-600 font-medium">
                      Error loading transactions
                    </p>
                  </CardContent>
                </Card>
              ) : transactions && transactions.length === 0 ? (
                <Card className="border border-dashed border-indigo-200 bg-indigo-50/30">
                  <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                    <PackageOpen className="h-14 w-14 text-indigo-300 mb-4" />
                    <CardTitle className="text-lg font-medium text-indigo-800 mb-2">
                      No Transactions Yet
                    </CardTitle>
                    <p className="text-sm text-indigo-600/70 max-w-md">
                      This supplier doesn&apos;t have any purchase history. When
                      you make transactions with this supplier, they will appear
                      here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                transactions && (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <Card
                        key={transaction.id}
                        className="border border-indigo-50 hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                      >
                        <CardContent className="p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1.5">
                              <p className="font-medium text-gray-800 flex items-center">
                                <PackageOpen className="h-3.5 w-3.5 mr-1.5 text-indigo-500" />
                                {transaction.productName}
                              </p>
                              <div className="flex items-center text-sm text-gray-500 gap-2">
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1 text-indigo-400" />
                                  {formatDate(transaction.date, "short")}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center">
                                  <ArrowUpDown className="h-3 w-3 mr-1 text-indigo-400" />
                                  {transaction.quantity} units at{" "}
                                  {formatCurrency(transaction.unitPrice)} each
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Badge className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 font-medium px-3 py-1.5">
                                {formatCurrency(transaction.total)}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}