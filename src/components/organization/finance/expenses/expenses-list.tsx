"use client"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ExpensesListProps {
  expenses: any[]
  isLoading: boolean
  pagination?: {
    totalPages?: number
    currentPage?: number
    totalExpenses?: number
  }
  onPageChange?: (page: number) => void
}

export function ExpensesList({ expenses = [], isLoading, pagination, onPageChange }: ExpensesListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (error) {
      return dateString
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === "paid") return "success"
    if (statusLower === "pending") return "warning"
    if (statusLower === "overdue") return "destructive"
    return "secondary"
  }

  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage)
    }
  }

  if (isLoading) {
    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[120px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[40px]" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (!expenses.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No expenses found. Try adjusting your filters or add a new expense.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id} className="group hover:bg-muted/50">
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>{formatCurrency(expense.amount)}</TableCell>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(expense.status)}>{expense.status}</Badge>
                </TableCell>
                <TableCell>{expense.createdBy?.name}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreHorizontalIcon className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Expense</DropdownMenuItem>
                      <DropdownMenuItem>Delete Expense</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between py-4 px-2">
          <div className="text-sm text-muted-foreground">
            Showing page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange((pagination.currentPage || 1) - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="sr-only">Previous Page</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange((pagination.currentPage || 1) + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronRightIcon className="h-4 w-4" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
