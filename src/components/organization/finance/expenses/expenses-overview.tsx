"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ExpensesList } from "./expenses-list"
import { ExpensesStats } from "./expenses-stats"
import { useTransition } from "react"
import { 
  useQueryState, 
  useQueryStates, 
  parseAsString, 
  parseAsInteger, 
  parseAsBoolean,
  parseAsIsoDateTime
} from "nuqs"
import { 
  Expense,
  useExpenses,
} from "@/lib/hooks/use-expenses"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { CreateExpenseSheet } from "./create-expense-sheet"
import ExpenseModal from "./create-modal"
import { MotionDiv } from "@/components/motion"
import { Button } from "@/components/ui"
import { Plus, Wallet2 } from "lucide-react"


interface PaginationData {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ExpensesResponse {
  expenses: Expense[]
  pagination: PaginationData
}

const DEFAULT_PAGE_SIZE = 10

export function ExpensesOverview() {
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useQueryState(
    'create',
    parseAsBoolean.withDefault(false).withOptions({
      history: 'push',
      shallow: false,
    })
  );

  // Filter states with nuqs
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({
      history: 'push',
      shallow: false,
      startTransition
    })
  )

  const [
    { category, department, vendor, status, taxDeductible, page, pageSize },
    setFilters
  ] = useQueryStates(
    {
      category: parseAsString.withDefault(''),
      department: parseAsString.withDefault(''),
      vendor: parseAsString.withDefault(''),
      status: parseAsString.withDefault(''),
      taxDeductible: parseAsBoolean.withDefault(false),
      page: parseAsInteger.withDefault(1),
      pageSize: parseAsInteger.withDefault(DEFAULT_PAGE_SIZE)
    },
    {
      history: 'push',
      shallow: false,
      startTransition
    }
  )

  const [startDate, setStartDate] = useQueryState(
    'startDate',
    parseAsIsoDateTime.withOptions({
      history: 'push',
      shallow: false,
      startTransition
    })
  )

  const [endDate, setEndDate] = useQueryState(
    'endDate',
    parseAsIsoDateTime.withOptions({
      history: 'push',
      shallow: false,
      startTransition
    })
  )

  // Build filter object for API query
  const filters: Record<string, string | number | boolean | undefined> = {
    search: search || undefined,
    category: category || undefined,
    department: department || undefined,
    vendor: vendor || undefined,
    status: status || undefined,
    taxDeductible: taxDeductible,
    dateFrom: startDate instanceof Date ? startDate.toISOString() : undefined,
    dateTo: endDate instanceof Date ? endDate.toISOString() : undefined,
    skip: (page - 1) * pageSize,
    take: pageSize
  }

  // Fetch expenses data using react-query hook
  const { 
    data, 
    isLoading, 
    isError, 
    error 
  } = useExpenses(filters)
  

  // Safely extract and transform data from the API
  const apiData = data as ExpensesResponse | undefined
  const expenses = apiData?.expenses || []
  const pagination = apiData?.pagination || {
    total: 0,
    page: page,
    limit: pageSize,
    totalPages: 0
  }

  const handlePageChange = (newPage: number) => {
    setFilters({ page: newPage })
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SectionHeader
          title="Expenses"
          subtitle="Manage all your organization expenses"
          icon={
            <Wallet2 className="text-lg"/>
          }
        />
      </div>

      {isLoading && !expenses.length ? (
        <div className="space-y-6 animate-pulse">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : isError ? (
        <Card className="p-6 border-destructive">
          <p className="text-destructive">
            Error loading expenses: {(error as Error)?.message || 'Please try again later.'}
          </p>
        </Card>
      ) : (
        <>
          <ExpensesStats expenses={expenses} />
          <MotionDiv whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="relative overflow-hidden group">
            <Button
              className="px-6 items-center text-white shadow-lg hover:shadow-xl transition-all duration-300 "
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Expense
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
            </Button>
          </MotionDiv>
          <div className="space-y-4">
            <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
              <CardHeader className="bg-muted/50 pb-3">
                <CardTitle>All Expenses</CardTitle>
                <CardDescription>
                  {pagination?.total
                    ? `Showing ${Math.min(expenses.length, pagination.limit)} of ${pagination.total} expenses`
                    : 'Manage all your organization expenses'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ExpensesList
                  expenses={expenses}
                  isLoading={isLoading || isPending}
                  pagination={{
                    totalPages: pagination.totalPages,
                    currentPage: pagination.page,
                    totalExpenses: pagination.total,
                  }}
                  onPageChange={handlePageChange}
                />
              </CardContent>
            </Card>
          </div>
          <ExpenseModal isOpen={isCreateOpen as boolean} onClose={() => setIsCreateOpen(false)} />
          {/* <CreateExpenseSheet open={isCreateOpen as boolean} setOpen={setIsCreateOpen} /> */}
        </>
      )}
    </div>
  );
}
