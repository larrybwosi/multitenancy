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
         icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7h20L12 2z"/><path d="M2 7v14l10 5 10-5V7H2z"/></svg>}
         />
      </div>

      {isLoading && !expenses.length ? (
        <div className="space-y-6 animate-pulse">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : isError ? (
        <Card className="p-6 border-destructive">
          <p className="text-destructive">Error loading expenses: {(error as Error)?.message || 'Please try again later.'}</p>
        </Card>
      ) : (
        <>
          <ExpensesStats expenses={expenses} />

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
                    totalExpenses: pagination.total
                  }}
                  onPageChange={handlePageChange}
                />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
