import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TransactionDetailsSheet from "./transaction-details";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StockTransaction } from "../types";

interface OverviewTabProps {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentTransactions: StockTransaction[];
  organizationId: string;
}

const OverviewTab = ({
  totalItems,
  totalValue,
  lowStockCount,
  outOfStockCount,
  recentTransactions,
  organizationId,
}: OverviewTabProps) => {
  // organizationId is available for future use if needed
  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Inventory Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(totalValue)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Items in Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{totalItems}</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Low/Out of Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <p className="text-2xl font-bold text-orange-500">
              {lowStockCount + outOfStockCount}
            </p>
            {(lowStockCount + outOfStockCount) > 0 && (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock and Recent Transactions Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Items that need your attention</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(lowStockCount + outOfStockCount) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        No items need attention 👍
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-lg font-semibold">
              Recent Transactions
            </CardTitle>
            <CardDescription>Latest inventory movements</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No recent transactions
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-gray-50">
                        <TableCell className="text-gray-500 text-sm">
                          {formatDate(transaction.transactionDate)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.productName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className="whitespace-nowrap"
                            >
                              {transaction.transactionType}
                            </Badge>
                            <span
                              className={`text-sm font-medium ${
                                transaction.direction === "IN"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.direction === "IN" ? "+" : "-"}
                              {transaction.quantity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          {formatCurrency(transaction.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-gray-100"
                              >
                                View
                              </Button>
                            </SheetTrigger>
                            <TransactionDetailsSheet transaction={transaction} />
                          </Sheet>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewTab;
