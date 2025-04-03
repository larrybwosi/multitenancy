'use client'

import { useEffect, useState } from "react";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Search,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  Filter,
  CalendarIcon,
  Plus,
  ArrowUpDown,
} from "lucide-react";
import { getStockTransactionsForTab } from "@/actions/stock";
import { StockTransaction } from "../types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface TransactionsTabProps {
  organizationId: string;
}

const TransactionsTab = ({ organizationId }: TransactionsTabProps) => {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [sortBy, setSortBy] = useState("transactionDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedType, setSelectedType] = useState<string>("");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        // Convert date range to string format for the API
        const dateFrom = dateRange.from?.toISOString();
        const dateTo = dateRange.to?.toISOString();

        // Load transactions from the server
        const response = await getStockTransactionsForTab(organizationId, {
          page: currentPage,
          limit: 10,
          sortBy,
          sortOrder,
          search: searchQuery.length > 2 ? searchQuery : undefined,
          dateFrom,
          dateTo,
          transactionType: selectedType || undefined,
        });

        if (response.success && response.data) {
          setTransactions(response.data);
          setTotalPages(response.meta?.totalPages || 1);
          setTotalTransactions(response.meta?.total || 0);
        } else {
          console.error("Failed to fetch transactions:", response.error);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentPage, sortBy, sortOrder, searchQuery, selectedType, dateRange, organizationId]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc"); // Default to descending for new sort columns
    }
  };

  // Handle pagination
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Handle filter reset
  const resetFilters = () => {
    setSelectedType("");
    setDateRange({ from: undefined, to: undefined });
    setSearchQuery("");
    setCurrentPage(1);
  };

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
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40 border-gray-200 bg-white">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <SelectValue placeholder="Filter by type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="PURCHASE">Purchase</SelectItem>
                <SelectItem value="SALE">Sale</SelectItem>
                <SelectItem value="RETURN">Return</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex justify-start text-left font-normal w-[240px]"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                      </>
                    ) : (
                      formatDate(dateRange.from)
                    )
                  ) : (
                    "Select date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{
                    from: dateRange.from,
                    to: dateRange.to,
                  }}
                  onSelect={(range) => 
                    setDateRange({ 
                      from: range?.from, 
                      to: range?.to 
                    })
                  }
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col md:flex-row justify-between gap-4 bg-gray-50 border-t py-4">
        <div className="text-sm text-gray-500">
          Showing{" "}
          {transactions.length > 0
            ? (currentPage - 1) * 10 + 1
            : 0}{" "}
          to {Math.min(currentPage * 10, transactions.length)}{" "}
          of {totalTransactions} transactions
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
