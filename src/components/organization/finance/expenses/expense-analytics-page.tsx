"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { useQueryState } from "nuqs"
import { useQuery } from "@tanstack/react-query"

// Define an Expense interface to fix the any[] type error
interface Expense {
  id: string
  date: string
  amount: number
  category: string
  department: string
  description: string
  status: string
}

interface ApiResponse {
  expenses: Expense[]
  metadata: {
    timeframe: string
    year: string
    totalExpenses: number
    totalAmount: number
  }
}

export function ExpenseAnalyticsPage() {
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  
  // URL state using nuqs
  const [activeTab, setActiveTab] = useQueryState("view", {
    defaultValue: "overview"
  })
  
  const [timeframe, setTimeframe] = useQueryState("timeframe", {
    defaultValue: "monthly"
  })
  
  const [year, setYear] = useQueryState("year", {
    defaultValue: new Date().getFullYear().toString()
  })
  
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  
  const [startDateParam, setStartDateParam] = useQueryState("startDate")
  const [endDateParam, setEndDateParam] = useQueryState("endDate")
  
  // Sync URL state with component state for dates
  useEffect(() => {
    if (startDateParam) {
      setStartDate(new Date(startDateParam))
    }
    if (endDateParam) {
      setEndDate(new Date(endDateParam))
    }
  }, [startDateParam, endDateParam])

  // Use Tanstack Query for data fetching with caching
  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['expenseAnalytics', timeframe, year, startDateParam, endDateParam],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append("timeframe", timeframe || "monthly")
      params.append("year", year || new Date().getFullYear().toString())
      if (startDateParam) params.append("startDate", startDateParam)
      if (endDateParam) params.append("endDate", endDateParam)
      params.append("limit", "1000") // Get more data for analytics

      const response = await fetch(`/api/finance/expenses/analytics?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch expense analytics data')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateDates()
  }

  const handleReset = () => {
    setTimeframe("monthly")
    setYear(new Date().getFullYear().toString())
    setStartDate(undefined)
    setEndDate(undefined)
    setStartDateParam(null)
    setEndDateParam(null)
  }

  const updateDates = () => {
    if (startDate) {
      setStartDateParam(startDate.toISOString().split("T")[0])
    } else {
      setStartDateParam(null)
    }
    
    if (endDate) {
      setEndDateParam(endDate.toISOString().split("T")[0])
    } else {
      setEndDateParam(null)
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (timeframe !== "monthly") count++
    if (year !== new Date().getFullYear().toString()) count++
    if (startDateParam) count++
    if (endDateParam) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  // Handle error state
  if (error) {
    console.error("Error fetching expense analytics:", error)
  }

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
                  <Select value={timeframe || "monthly"} onValueChange={setTimeframe}>
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

                  <Select value={year || new Date().getFullYear().toString()} onValueChange={setYear}>
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

          {error ? (
            <Card className="p-8 text-center">
              <h3 className="text-lg font-medium">Error loading expense data</h3>
              <p className="text-muted-foreground mt-2">
                There was an error loading the analytics data. Please try again later.
              </p>
              <Button onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </Card>
          ) : (
            <Tabs value={activeTab || "overview"} onValueChange={setActiveTab} className="space-y-6">
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

              <ExpenseAnalytics 
                expenses={data?.expenses || []} 
                activeTab={activeTab || "overview"} 
                timeframe={timeframe || "monthly"} 
              />
            </Tabs>
          )}
        </>
      )}
    </div>
  )
}
