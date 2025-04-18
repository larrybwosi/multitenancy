"use client"

import { CalendarIcon, MoreHorizontalIcon, EyeIcon, EditIcon, TrashIcon, PauseIcon, PlayIcon } from "lucide-react"
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
import { toast } from "sonner"

interface RecurringExpense {
  id: string
  description: string
  amount: number
  date: string
  category: string
  paymentMethod: string
  status: string
  vendor: string
  isRecurring: boolean
  recurringDetails: {
    frequency: string
    nextDate: string
    endDate: string | null
  }
}

interface RecurringExpensesListProps {
  expenses: RecurringExpense[] | undefined | null
  isLoading: boolean
  pagination:
    | {
        page: number
        limit: number
        totalExpenses: number
        totalPages: number
      }
    | undefined
    | null
  onPageChange: (page: number) => void
}

export function RecurringExpensesList({
  expenses = [],
  isLoading,
  pagination,
  onPageChange,
}: RecurringExpensesListProps) {
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
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date)
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Invalid date"
    }
  }

  const handlePauseRecurring = (id: string) => {
    toast.success("Recurring expense paused",{
      description: "The recurring expense has been paused successfully.",
    })
  }

  const handleResumeRecurring = (id: string) => {
    toast.success("Recurring expense resumed",{
      description: "The recurring expense has been resumed successfully.",
    })
  }

  // Ensure expenses is an array
  const safeExpenses = Array.isArray(expenses) ? expenses : []

  // Ensure pagination is an object
  const safePagination = pagination || { page: 1, limit: 10, totalExpenses: 0, totalPages: 1 }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead>
                <tr className="border-b bg-muted/50 transition-colors">
                  <th className="h-10 px-4 text-left font-medium">Description</th>
                  <th className="h-10 px-4 text-left font-medium">Frequency</th>
                  <th className="h-10 px-4 text-left font-medium">Next Date</th>
                  <th className="h-10 px-4 text-left font-medium">End Date</th>
                  <th className="h-10 px-4 text-left font-medium">Category</th>
                  <th className="h-10 px-4 text-left font-medium">Vendor</th>
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
                      <Skeleton className="h-4 w-[100px]" />
                    </td>
                    <td className="p-4 align-middle">
                      <Skeleton className="h-4 w-[100px]" />
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

  if (!safeExpenses || safeExpenses.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center border rounded-md">
        <div className="text-center">
          <p className="text-lg font-medium">No recurring expenses found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or create a new recurring expense</p>
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
                <th className="h-10 px-4 text-left font-medium">Frequency</th>
                <th className="h-10 px-4 text-left font-medium">Next Date</th>
                <th className="h-10 px-4 text-left font-medium">End Date</th>
                <th className="h-10 px-4 text-left font-medium">Category</th>
                <th className="h-10 px-4 text-left font-medium">Vendor</th>
                <th className="h-10 px-4 text-right font-medium">Amount</th>
                <th className="h-10 px-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeExpenses.map((expense) => (
                <tr key={expense.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">{expense.description}</td>
                  <td className="p-4 align-middle">
                    <Badge variant="outline">{expense.recurringDetails?.frequency || "N/A"}</Badge>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {expense.recurringDetails?.nextDate ? formatDate(expense.recurringDetails.nextDate) : "N/A"}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    {expense.recurringDetails?.endDate ? (
                      formatDate(expense.recurringDetails.endDate)
                    ) : (
                      <span className="text-muted-foreground">No end date</span>
                    )}
                  </td>
                  <td className="p-4 align-middle">
                    <Badge variant="outline">{expense.category || "N/A"}</Badge>
                  </td>
                  <td className="p-4 align-middle">{expense.vendor || "N/A"}</td>
                  <td className="p-4 align-middle text-right font-medium">{formatCurrency(expense.amount || 0)}</td>
                  <td className="p-4 align-middle text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontalIcon className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <EditIcon className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePauseRecurring(expense.id)}>
                          <PauseIcon className="mr-2 h-4 w-4" />
                          Pause
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResumeRecurring(expense.id)}>
                          <PlayIcon className="mr-2 h-4 w-4" />
                          Resume
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

      {safePagination && safePagination.totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, safePagination.page - 1))}
                disabled={safePagination.page === 1}
              />
            </PaginationItem>
            {Array.from({ length: safePagination.totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink onClick={() => onPageChange(page)} isActive={page === safePagination.page}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => onPageChange(Math.min(safePagination.totalPages, safePagination.page + 1))}
                disabled={safePagination.page === safePagination.totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
