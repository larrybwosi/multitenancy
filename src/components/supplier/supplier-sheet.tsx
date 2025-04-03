"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Supplier } from "@prisma/client";
import { getSupplierStockHistory } from "@/actions/supplier";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MoreVertical } from "lucide-react";

type Transaction = {
  id: string;
  date: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  status: "completed" | "pending" | "cancelled";
};

export default function SupplierSheet({
  supplier,
  onOpenChange,
}: {
  supplier: Supplier;
  onOpenChange?: (open: boolean) => void;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (supplier) {
      setLoading(true);
      const fetchTransactions = async () => {
        try {
          const result = await getSupplierStockHistory("org_123", supplier.id); // Replace with actual org ID from auth/session

          if (!result.success) {
            throw new Error(result.error);
          }

          // Transform the data to match the expected format
          const transformed = result.data.items.map((item) => ({
            id: item.stockId,
            date: item.transactionDate?.toISOString() || new Date().toISOString(),
            productName: item.productName,
            quantity: item.quantityPurchased,
            unitPrice: item.buyingPricePerUnit,
            total: item.totalBuyingPrice,
            status: "completed" as const,
          }));

          setTransactions(transformed);
        } catch (error) {
          console.error("Error fetching transactions:", error);
          toast.error("Error loading transactions",{
            description:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchTransactions();
    }
  }, [supplier]);

  return (
    <Sheet onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
        >
          <span className="sr-only">Open details</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[600px]">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            <SheetHeader>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 bg-blue-100 text-blue-600">
                  <AvatarFallback>
                    {supplier.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-2xl font-bold text-gray-900">
                    {supplier.name}
                  </SheetTitle>
                  <p className="text-sm text-gray-500">
                    Supplier since{" "}
                    {new Date(supplier.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </SheetHeader>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="bg-blue-50 border-blue-100">
                <CardHeader className="pb-2">
                  <p className="text-sm font-medium text-blue-600">
                    Total Spent
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-800">
                    $
                    {(supplier.totalSpent || 0).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-100">
                <CardHeader className="pb-2">
                  <p className="text-sm font-medium text-green-600">
                    Last Order
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-800">
                    {supplier.lastOrderDate
                      ? new Date(supplier.lastOrderDate).toLocaleDateString()
                      : "No orders"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Contact Information</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Contact Person</p>
                  <p className="font-medium">
                    {supplier.contactPerson || (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">
                    {supplier.email || (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">
                    {supplier.phone || (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">
                    {supplier.address || (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200" />

            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Recent Transactions</h3>
              {loading ? (
                <div className="py-6 text-center">
                  <p className="text-gray-500">Loading transactions...</p>
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <Card
                      key={transaction.id}
                      className="border-gray-200 shadow-sm"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {transaction.productName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.date).toLocaleDateString()}{" "}
                              •
                              <span className="ml-1">
                                {transaction.quantity} × $
                                {transaction.unitPrice.toFixed(2)}
                              </span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              ${transaction.total.toFixed(2)}
                            </p>
                            <Badge
                              variant="outline"
                              className={
                                transaction.status === "completed"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : transaction.status === "pending"
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                              }
                            >
                              {transaction.status.charAt(0).toUpperCase() +
                                transaction.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-gray-500">No recent transactions</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
