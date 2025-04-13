"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { PlusIcon, FilterIcon, DownloadIcon, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { ExpensesList } from "./expenses-list"
import { ExpensesStats } from "./expenses-stats"
import { RecurringExpensesList } from "./recurring-expenses-list"
import { CreateExpenseSheet } from "./create-expense-sheet"

export function ExpensesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(true)
  const [expenses, setExpenses] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>({})
  const [categories, setCategories] = useState<string[]>([])
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all")

  // Filter states
  const [category, setCategory] = useState(searchParams.get("category") || "")
  const [startDate, setStartDate] = useState<Date | undefined>(\
    searchParams.get("startDate\") ? new Date(  setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate") ? new Date(searchParams.get("startDate") as string) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate") ? new Date(searchParams.get("endDate") as string) : undefined,
  )
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [page, setPage] = useState(Number.parseInt(searchParams.get("page") || "1"))

  useEffect(() => {
    fetchExpenses()
  }, [category, startDate, endDate, search, page, activeTab])

  const fetchExpenses = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.append("category", category)
      if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])
      if (endDate) params.append("endDate", endDate.toISOString().split("T")[0])
      if (search) params.append("search", search)
      if (activeTab === "recurring") params.append("isRecurring", "true")
      params.append("page", page.toString())
      params.append("limit", "10")

      const response = await fetch(`/api/organization/finance/expenses?${params.toString()}`)
      const data = await response.json()

      setExpenses(data.expenses)
      setPagination(data.pagination)
      setCategories(data.categories)
    } catch (error) {
      console.error("Error fetching expenses:", error)
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
    setCategory("")
    setStartDate(undefined)
    setEndDate(undefined)
    setSearch("")
    setPage(1)
    router.push(`/organization/finance/expenses?tab=${activeTab}`)
  }

  const updateQueryParams = () => {
    const params = new URLSearchParams()
    params.append("tab", activeTab)
    if (category) params.append("category", category)
    if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])
    if (endDate) params.append("endDate", endDate.toISOString().split("T")[0])
    if (search) params.append("search", search)
    params.append("page", page.toString())

    router.push(`/organization/finance/expenses?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    updateQueryParams()
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setPage(1)
    const params = new URLSearchParams()
    params.append("tab", value)
    router.push(`/organization/finance/expenses?${params.toString()}`)
  }

  const handleExpenseCreated = () => {
    setIsCreateSheetOpen(false)
    fetchExpenses()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <Button onClick={() => setIsCreateSheetOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {isLoading && !expenses.length ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          <ExpensesStats expenses={expenses} />

          <Card>
            <CardHeader>
              <CardTitle>Manage Expenses</CardTitle>
              <CardDescription>View and manage all your expenses and recurring payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="all">All Expenses</TabsTrigger>
                  <TabsTrigger value="recurring">Recurring Expenses</TabsTrigger>
                </TabsList>

                <div className="space-y-4">
                  <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1">
                      <Input
                        placeholder="Search expenses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
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
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Calendar View
                    </Button>
                  </div>

                  <TabsContent value="all" className="mt-0">
                    <ExpensesList
                      expenses={expenses}
                      isLoading={isLoading}
                      pagination={pagination}
                      onPageChange={handlePageChange}
                    />
                  </TabsContent>

                  <TabsContent value="recurring" className="mt-0">
                    <RecurringExpensesList
                      expenses={expenses.filter((e) => e.isRecurring)}
                      isLoading={isLoading}
                      pagination={pagination}
                      onPageChange={handlePageChange}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      <CreateExpenseSheet
        open={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        categories={categories}
        onExpenseCreated={handleExpenseCreated}
      />
    </div>
  )
}
