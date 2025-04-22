"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, FilterIcon, ArrowUpDownIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { TransactionsList } from "./transactions-list"
import { TransactionsStats } from "./transactions-stats"
import { CreateTransactionSheet } from "./create-transaction-sheet"
import { useTransactions } from "@/hooks/use-transactions"
import { TransactionCategories } from "@/types/finance"
import { toast } from "sonner"
import { useQueryState, parseAsString, parseAsInteger } from "nuqs"

export function TransactionsPage() {
  const router = useRouter()

  // URL state management with nuqs
  const [type, setType] = useQueryState("type", parseAsString)
  const [category, setCategory] = useQueryState("category", parseAsString)
  const [startDateStr, setStartDateStr] = useQueryState("startDate", parseAsString)
  const [endDateStr, setEndDateStr] = useQueryState("endDate", parseAsString)
  const [search, setSearch] = useQueryState("search", parseAsString)
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useQueryState("createSheet", parseAsString.withDefault(""))

  // Local state for date pickers to work with DatePicker component requirements
  const [startDateLocal, setStartDateLocal] = useState<Date | undefined>(
    startDateStr ? new Date(startDateStr) : undefined
  )
  const [endDateLocal, setEndDateLocal] = useState<Date | undefined>(
    endDateStr ? new Date(endDateStr) : undefined
  )

  // Update local dates when URL params change
  useEffect(() => {
    setStartDateLocal(startDateStr ? new Date(startDateStr) : undefined)
  }, [startDateStr])

  useEffect(() => {
    setEndDateLocal(endDateStr ? new Date(endDateStr) : undefined)
  }, [endDateStr])

  // Fetch transactions using TanStack Query
  const { 
    data, 
    isLoading, 
    isError, 
    refetch 
  } = useTransactions({
    page,
    type: type || undefined,
    category: category || undefined,
    startDate: startDateStr || undefined,
    endDate: endDateStr || undefined,
    search: search || undefined,
  })

  // Create a safe version of the transactions data
  const transactions = data?.transactions || []

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast.error("Failed to load transactions. Please try again.")
    }
  }, [isError])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleReset = () => {
    setType(null)
    setCategory(null)
    setStartDateStr(null)
    setEndDateStr(null)
    setSearch(null)
    setPage(1)
    router.push("/finance/transactions")
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleTransactionCreated = () => {
    setIsCreateSheetOpen("")
    refetch()
    toast.success("Transaction created successfully")
  }

  const handleExport = () => {
    // Implementation for exporting transactions
    toast.info("Exporting transactions...")
  }

  const handleSort = () => {
    // Implementation for sorting transactions
    toast.info("Sorting options coming soon")
  }

  // Handle date changes
  const onStartDateChange = (date: Date | undefined) => {
    setStartDateLocal(date)
    setStartDateStr(date ? date.toISOString().split("T")[0] : null)
  }

  const onEndDateChange = (date: Date | undefined) => {
    setEndDateLocal(date)
    setEndDateStr(date ? date.toISOString().split("T")[0] : null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <Button onClick={() => setIsCreateSheetOpen("open")} className="bg-primary hover:bg-primary/90">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {isLoading && !transactions.length ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full rounded-md" />
          <Skeleton className="h-[400px] w-full rounded-md" />
        </div>
      ) : (
        <>
          <TransactionsStats transactions={transactions} />

          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/40">
              <CardTitle>Transactions</CardTitle>
              <CardDescription>View and manage all your financial transactions</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <Input
                      placeholder="Search transactions..."
                      value={search || ""}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* <Select value={type || ""} onValueChange={setType}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={category || ""} onValueChange={setCategory}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {data?.categories && renderCategoryOptions(data.categories)}
                      </SelectContent>
                    </Select> */}

                    <DatePicker 
                      date={startDateLocal} 
                      setDate={onStartDateChange} 
                      placeholder="Start Date" 
                    />

                    <DatePicker 
                      date={endDateLocal} 
                      setDate={onEndDateChange} 
                      placeholder="End Date" 
                    />

                    <Button type="submit" variant="secondary">
                      <FilterIcon className="mr-2 h-4 w-4" />
                      Filter
                    </Button>

                    <Button type="button" variant="outline" onClick={handleReset}>
                      Reset
                    </Button>
                  </div>
                </form>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSort}>
                    <ArrowUpDownIcon className="mr-2 h-4 w-4" />
                    Sort
                  </Button>
                </div>

                <TransactionsList
                  transactions={transactions}
                  isLoading={isLoading}
                  pagination={data?.pagination || { page: 1, limit: 10, totalTransactions: 0, totalPages: 1 }}
                  onPageChange={handlePageChange}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <CreateTransactionSheet
        open={isCreateSheetOpen === "open"}
        onOpenChange={(open) => setIsCreateSheetOpen(open ? "open" : "")}
        categories={data?.categories || { income: [], expense: [] }}
        onTransactionCreated={handleTransactionCreated}
      />
    </div>
  )
}

// Helper function to render category options
function renderCategoryOptions(categories: TransactionCategories) {
  return (
    <>
      {categories.income?.length > 0 && (
        <>
          <SelectItem value="income" disabled className="font-semibold">
            Income
          </SelectItem>
          {categories.income.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </>
      )}
      {categories.expense?.length > 0 && (
        <>
          <SelectItem value="expense" disabled className="font-semibold">
            Expense
          </SelectItem>
          {categories.expense.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </>
      )}
    </>
  )
}
