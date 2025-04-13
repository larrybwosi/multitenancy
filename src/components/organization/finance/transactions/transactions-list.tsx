"use client"
import Link from "next/link"
import { ArrowDownIcon, ArrowUpIcon, MoreHorizontalIcon, EyeIcon, EditIcon, TrashIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface Transaction {
  id: string
  description: string
  amount: number
  type: "income" | "expense"
  date: string
  category: string
  paymentMethod: string
  status: string
}

interface TransactionsListProps {
  transactions: Transaction[]
  isLoading: boolean
  pagination: {
    page: number
    limit: number
    totalTransactions: number
    totalPages: number
  }
  onPageChange: (page: number) => void
}

export function TransactionsList({ transactions, isLoading, pagination, onPageChange }: TransactionsListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge variant="success">Completed</Badge>
      case "pending":
        return <Badge variant="warning">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b bg-muted/50 transition-colors">
                  <th className="h-10 px-4 text-left font-medium">Description</th>
                  <th className="h-10 px-4 text-left font-medium">Date</th>
                  <th className="h-10 px-4 text-left font-medium">Category</th>
                  <th className="h-10 px-4 text-left font-medium">Payment Method</th>
                  <th className="h-10 px-4 text-left font-medium">Status</th>
                  <th className="h-10 px-4 text-right font-medium">Amount</th>
                  <th className="h-10 px-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b transition-colors">
                    <td className="p-4 align-middle">
                      <Skeleton className="h-4 w-[200px]" />
                    </td>
                    <td className="p-4 align-middle">
                      <Skeleton className="h-4 w-[100px]" />
                    </td>
                    <td className="p-4 align-middle">
                      <Skeleton className="h-4 w-[100px]" />
                    </td>
                    <td className="p-4 align-middle">
                      <Skeleton className="h-4 w-[100px]" />
                    </td>
                    <td className="p-4 align-middle">
                      <Skeleton className="h-4 w-[80px]" />
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Skeleton className="h-4 w-[80px] ml-auto" />
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-10 w-[300px]" />
        </div>
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center border rounded-md">
        <div className="text-center">
          <p className="text-lg font-medium">No transactions found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or create a new transaction</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b bg-muted/50 transition-colors">
                <th className="h-10 px-4 text-left font-medium">Description</th>
                <th className="h-10 px-4 text-left font-medium">Date</th>
                <th className="h-10 px-4 text-left font-medium">Category</th>
                <th className="h-10 px-4 text-left font-medium">Payment Method</th>
                <th className="h-10 px-4 text-left font-medium">Status</th>
                <th className="h-10 px-4 text-right font-medium">Amount</th>
                <th className="h-10 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">
                    <Link href={`/organization/finance/transactions/${transaction.id}`} className="hover:underline">
                      {transaction.description}
                    </Link>
                  </td>
                  <td className="p-4 align-middle">{formatDate(transaction.date)}</td>
                  <td className="p-4 align-middle">
                    <Badge variant="outline">{transaction.category}</Badge>
                  </td>
                  <td className="p-4 align-middle">{transaction.paymentMethod}</td>
                  <td className="p-4 align-middle">{getStatusBadge(transaction.status)}</td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex items-center justify-end">
                      {transaction.type === "income" ? (
                        <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
                      )}
                      <span className={transaction.type === "income" ? "text-green-500" : "text-red-500"}>
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontalIcon className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/organization/finance/transactions/${transaction.id}`}>
                            <EyeIcon className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <EditIcon className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                disabled={pagination.page === 1}
              />
            </PaginationItem>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink onClick={() => onPageChange(page)} isActive={page === pagination.page}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page === pagination.totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
