'use client'
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import TransactionDetailsSheet from "./transaction-details";
import { transactions } from "../mock-data";
import {
  Search,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  Filter,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const TransactionsTab = () => {
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesType =
      filterType === "all" ||
      (filterType === "inbound" && transaction.direction === "IN") ||
      (filterType === "outbound" && transaction.direction === "OUT");

    const matchesSearch =
      transaction.productName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.supplierName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesType && matchesSearch;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <Card className="shadow-md bg-white border-0">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-gray-800">
              Transaction History
            </CardTitle>
            <CardDescription className="text-gray-500">
              Track and manage your inventory movements
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                className="pl-10 pr-4 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <SelectValue placeholder="Filter by type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-gray-600">Date</TableHead>
                <TableHead className="text-gray-600">Product</TableHead>
                <TableHead className="text-gray-600">Type</TableHead>
                <TableHead className="text-gray-600">Direction</TableHead>
                <TableHead className="text-gray-600">Qty</TableHead>
                <TableHead className="text-gray-600">Unit Price</TableHead>
                <TableHead className="text-gray-600">Total Amount</TableHead>
                <TableHead className="text-gray-600 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className={`
                    border-b hover:bg-gray-50 transition-colors
                    ${transaction.direction === "IN" ? "hover:bg-emerald-50" : "hover:bg-amber-50"}
                  `}
                >
                  <TableCell className="text-gray-500 text-sm">
                    {formatDate(transaction.transactionDate)}
                  </TableCell>
                  <TableCell className="font-medium text-gray-800">
                    {transaction.productName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-gray-100 text-gray-700 border-gray-200"
                    >
                      {transaction.transactionType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={`
                        ${
                          transaction.direction === "IN"
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        }
                      `}
                    >
                      <div className="flex items-center gap-1">
                        <ArrowDownUp className="h-3.5 w-3.5" />
                        {transaction.direction === "IN"
                          ? "Inbound"
                          : "Outbound"}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`font-medium tabular-nums ${
                      transaction.direction === "IN"
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }`}
                  >
                    {transaction.direction === "IN" ? "+" : "-"}
                    {transaction.quantity}
                  </TableCell>
                  <TableCell className="text-gray-600 tabular-nums">
                    {formatCurrency(transaction.unitPrice)}
                  </TableCell>
                  <TableCell className="font-medium text-gray-800 tabular-nums">
                    {formatCurrency(transaction.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          Details
                        </Button>
                      </SheetTrigger>
                      <TransactionDetailsSheet transaction={transaction} />
                    </Sheet>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedTransactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    No transactions found matching your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col md:flex-row justify-between gap-4 bg-gray-50 border-t py-4">
        <div className="text-sm text-gray-500">
          Showing{" "}
          {filteredTransactions.length > 0
            ? (currentPage - 1) * itemsPerPage + 1
            : 0}{" "}
          to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}{" "}
          of {filteredTransactions.length} transactions
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="border-gray-200 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            className="border-gray-200 hover:bg-gray-100"
          >
            Next
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TransactionsTab;
