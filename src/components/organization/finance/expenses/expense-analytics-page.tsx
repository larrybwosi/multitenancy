"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FilterIcon, DownloadIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExpenseAnalytics } from "./expense-analytics"
import { ExpensesNavigation } from "./expenses-navigation"

export function ExpenseAnalyticsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(true)
  const [expenses, setExpenses] = useState<any[]>([])
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get("view") || "overview")

  // Filter states
  const [timeframe, setTimeframe] = useState(searchParams.get("timeframe") || "monthly")
  const [year, setYear] = useState(searchParams.get("year") || new Date().getFullYear().toString())
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get("startDate") ? new Date(searchParams.get("startDate") as string) : undefined,
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get("endDate") ? new Date(searchParams.get("endDate") as string) : undefined,
  )

  useEffect(() => {
    fetchExpensesForAnalytics()
  }, [timeframe, year, startDate, endDate])

  const fetchExpensesForAnalytics = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("timeframe", timeframe)
      params.append("year", year)
      if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])
      if (endDate) params.append("endDate", endDate.toISOString().split("T")[0])
      params.append("limit", "1000") // Get more data for analytics

      const response = await fetch(`/api/finance/expenses/analytics?${params.toString()}`)
      const data = await response.json()

      setExpenses(data.expenses)
    } catch (error) {
      console.error("Error fetching expenses for analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateQueryParams()
  }

  const handleReset = () => {
    setTimeframe("monthly")
    setYear(new Date().getFullYear().toString())
    setStartDate(undefined)
    setEndDate(undefined)
    router.push(`/finance/expenses/analytics?view=${activeTab}`)
  }

  const updateQueryParams = () => {
    const params = new URLSearchParams()
    params.append("view", activeTab)
    params.append("timeframe", timeframe)
    params.append("year", year)
    if (startDate) params.append("startDate", startDate.toISOString().split("T")[0])
    if (endDate) params.append("endDate", endDate.toISOString().split("T")[0])

    router.push(`/finance/expenses/analytics?${params.toString()}`)
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams)
    params.set("view", value)
    router.push(`/finance/expenses/analytics?${params.toString()}`)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (timeframe !== "monthly") count++
    if (year !== new Date().getFullYear().toString()) count++
    if (startDate) count++
    if (endDate) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expense Analytics</h1>
          <p className="text-muted-foreground mt-1">Analyze and visualize your expense data</p>
        </div>
        <Button variant="outline" className="sm:w-auto w-full">
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <ExpensesNavigation />

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
            <CardHeader className="bg-muted/50 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Analytics Filters</CardTitle>
                  <CardDescription>Customize your expense analytics view</CardDescription>
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
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent
              className={`transition-all duration-300 ${isFilterExpanded ? "py-4" : "py-0 h-0 overflow-hidden"}`}
            >
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <DatePicker date={startDate} setDate={setStartDate} placeholder="Custom Start Date" />

                  <DatePicker date={endDate} setDate={setEndDate} placeholder="Custom End Date" />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="secondary">
                    Apply Filters
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="transition-all">
                Overview
              </TabsTrigger>
              <TabsTrigger value="categories" className="transition-all">
                Categories
              </TabsTrigger>
              <TabsTrigger value="departments" className="transition-all">
                Departments
              </TabsTrigger>
              <TabsTrigger value="trends" className="transition-all">
                Trends
              </TabsTrigger>
            </TabsList>

            <ExpenseAnalytics expenses={expenses} activeTab={activeTab} timeframe={timeframe} />
          </Tabs>
        </>
      )}
    </div>
  )
}
