"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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

export function TransactionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>({})
  const [categories, setCategories] = useState<any>({})
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)

  // Filter states
  const [type, setType] = useState(searchParams.get("type") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "")
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate") ? new Date(searchParams.get("startDate") as string) : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate") ? new Date(searchParams.get("endDate") as string) : undefined,
  )
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [page, setPage] = useState(Number.parseInt(searchParams.get("page") || "1"))

  useEffect(() => {
    fetchTransactions()
  }, [type, category, startDate, endDate, search, page])

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (type) params.append("type", type)
      if (category) params.append("category", category)
      if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])
      if (endDate) params.append("endDate", endDate.toISOString().split("T")[0])
      if (search) params.append("search", search)
      params.append("page", page.toString())
      params.append("limit", "10")

      const response = await fetch(`/api/organization/finance/transactions?${params.toString()}`)
      const data = await response.json()

      setTransactions(data.transactions)
      setPagination(data.pagination)
      setCategories(data.categories)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    updateQueryParams()
  }

  const handleReset = () => {
    setType("")
    setCategory("")
    setStartDate(undefined)
    setEndDate(undefined)
    setSearch("")
    setPage(1)
    router.push("/organization/finance/transactions")
  }

  const updateQueryParams = () => {
    const params = new URLSearchParams()
    if (type) params.append("type", type)
    if (category) params.append("category", category)
    if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])
    if (endDate) params.append("endDate", endDate.toISOString().split("T")[0])
    if (search) params.append("search", search)
    params.append("page", page.toString())

    router.push(`/organization/finance/transactions?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    updateQueryParams()
  }

  const handleTransactionCreated = () => {
    setIsCreateSheetOpen(false)
    fetchTransactions()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <Button onClick={() => setIsCreateSheetOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {isLoading && !transactions.length ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          <TransactionsStats transactions={transactions} />

          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>View and manage all your financial transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row">
                  <div className="flex-1">
                    <Input
                      placeholder="Search transactions..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.income && (
                          <>
                            <SelectItem value="income" disabled className="font-semibold">
                              Income
                            </SelectItem>
                            {categories.income.map((cat: string) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {categories.expense && (
                          <>
                            <SelectItem value="expense" disabled className="font-semibold">
                              Expense
                            </SelectItem>
                            {categories.expense.map((cat: string) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>

                    <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" />

                    <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" />

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
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <ArrowUpDownIcon className="mr-2 h-4 w-4" />
                    Sort
                  </Button>
                </div>

                <TransactionsList
                  transactions={transactions}
                  isLoading={isLoading}
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <CreateTransactionSheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        categories={categories}
        onTransactionCreated={handleTransactionCreated}
      />
    </div>
  )
}
