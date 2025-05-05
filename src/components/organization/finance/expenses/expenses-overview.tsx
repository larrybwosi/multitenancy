"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FilterIcon, DownloadIcon, SearchIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { ExpensesList } from "./expenses-list"
import { ExpensesStats } from "./expenses-stats"
import { ExpensesNavigation } from "./expenses-navigation"
import { CreateExpense } from "./create-expense-sheet"
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
  useExpenses,
} from "@/lib/hooks/use-expenses"

// Define types for expenses data
interface Expense {
  id: string
  description: string
  amount: number
  date?: string
  category: string | { name: string }
  paymentMethod?: string
  status?: string
  vendor?: string
  isRecurring: boolean
  recurringFrequency?: string
  taxDeductible?: boolean
  department?: string
  createdBy?: { name: string }
  frequency?: string
  nextDueDate?: string
  createdAt?: string
  updatedAt?: string
}

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
  const router = useRouter()
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

  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

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

  const handleReset = () => {
    setSearch('')
    setFilters({
      category: '',
      department: '',
      vendor: '',
      status: '',
      taxDeductible: false,
      page: 1
    })
    setStartDate(null)
    setEndDate(null)
    router.push('/finance/expenses')
  }

  const handleExportCSV = async () => {
    try {
      // Use string param conversion to handle serialization properly
      const queryString = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryString.append(key, String(value))
        }
      })
      
      const response = await fetch(`/api/finance/expenses/export?${queryString.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to export expenses')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `expenses-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error exporting expenses:", error)
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (search) count++
    if (category) count++
    if (department) count++
    if (vendor) count++
    if (status) count++
    if (taxDeductible !== false) count++
    if (startDate) count++
    if (endDate) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-muted-foreground mt-1">Track, manage, and analyze your organization&apos;s expenses</p>
        </div>
        <CreateExpense />
      </div>

      <ExpensesNavigation />

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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Expense Filters</CardTitle>
                    <CardDescription>Filter expenses by various criteria</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                      className="w-full sm:w-auto"
                    >
                      <FilterIcon className="mr-2 h-4 w-4" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={handleReset} className="w-full sm:w-auto">
                        <XIcon className="mr-2 h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent
                className={`transition-all duration-300 ${isFilterExpanded ? 'py-4' : 'py-0 h-0 overflow-hidden'}`}
              >
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1 relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search expenses..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9"
                      />
                      {isPending && search && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-primary animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">


                    <Select 
                      value={taxDeductible ? "true" : "false"} 
                      onValueChange={val => {
                        const taxDed = val === "true"
                        setFilters({ taxDeductible: taxDed, page: 1 })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tax Deductible" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">All</SelectItem>
                        <SelectItem value="true">Tax Deductible</SelectItem>
                      </SelectContent>
                    </Select>

                    <DatePicker 
                      date={startDate as Date | undefined}
                      setDate={(date: Date | undefined) => {
                        setStartDate(date)
                        setFilters({ page: 1 })
                      }}
                      placeholder="Start Date" 
                    />

                    <DatePicker 
                      date={endDate as Date | undefined}
                      setDate={(date: Date | undefined) => {
                        setEndDate(date)
                        setFilters({ page: 1 })
                      }}
                      placeholder="End Date" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="transition-all hover:bg-muted" onClick={handleExportCSV}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export to CSV
              </Button>
            </div>

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
