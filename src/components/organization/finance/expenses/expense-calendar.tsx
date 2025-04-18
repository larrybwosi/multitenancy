"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CalendarIcon,
  DollarSign,
  Tag,
  Building2,
} from "lucide-react"
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, isToday, isValid } from "date-fns"

interface Expense {
  id: string
  description: string
  amount: number
  date: string
  category: string
  paymentMethod: string | null
  vendor: string | null
  department: string | null
  project: string | null
  status: string
}

interface DayData {
  date: string
  expenses: Expense[]
  totalAmount: number
}

export function ExpenseCalendar() {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [view, setView] = useState<"month" | "day">("month")
  const [isLoading, setIsLoading] = useState(true)
  const [expenseData, setExpenseData] = useState<DayData[]>([])
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)

  // Fetch expense data for the current month
  useEffect(() => {
    const fetchExpenseData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const start = startOfMonth(date)
        const end = endOfMonth(date)

        const response = await fetch(
          `/api/organization/finance/expenses/calendar?` +
            `organizationId=org_01&` +
            `startDate=${start.toISOString()}&` +
            `endDate=${end.toISOString()}`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch expense data")
        }

        const data = await response.json()
        setExpenseData(data || [])
      } catch (error) {
        console.error("Error fetching expense data:", error)
        setError("Failed to load expense data. Please try again later.")
        setExpenseData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchExpenseData()
  }, [date])

  // Get selected day's expenses
  const selectedDayExpenses = useMemo(() => {
    if (!selectedDate || !isValid(selectedDate)) return []

    try {
      const selectedDateStr = selectedDate.toISOString().split("T")[0]
      const dayData = expenseData.find((day) => day.date === selectedDateStr)

      if (!dayData) return []

      let filteredExpenses = dayData.expenses || []

      // Apply category filter
      if (categoryFilter !== "all") {
        filteredExpenses = filteredExpenses.filter((expense) => expense.category === categoryFilter)
      }

      // Apply department filter
      if (departmentFilter !== "all") {
        filteredExpenses = filteredExpenses.filter((expense) => expense.department === departmentFilter)
      }

      return filteredExpenses
    } catch (error) {
      console.error("Error processing selected day expenses:", error)
      return []
    }
  }, [selectedDate, expenseData, categoryFilter, departmentFilter])

  // Calculate total for selected day
  const selectedDayTotal = useMemo(() => {
    return selectedDayExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  }, [selectedDayExpenses])

  // Get unique categories and departments for filters
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>()
    expenseData.forEach((day) => {
      ;(day.expenses || []).forEach((expense) => {
        if (expense.category) uniqueCategories.add(expense.category)
      })
    })
    return Array.from(uniqueCategories)
  }, [expenseData])

  const departments = useMemo(() => {
    const uniqueDepartments = new Set<string>()
    expenseData.forEach((day) => {
      ;(day.expenses || []).forEach((expense) => {
        if (expense.department) uniqueDepartments.add(expense.department)
      })
    })
    return Array.from(uniqueDepartments)
  }, [expenseData])

  // Navigation functions
  const goToPreviousMonth = () => setDate(subMonths(date, 1))
  const goToNextMonth = () => setDate(addMonths(date, 1))
  const goToToday = () => {
    setDate(new Date())
    setSelectedDate(new Date())
  }

  // Custom day render function to show expense indicators
  const renderDay = (day: Date | undefined) => {
    // Check if day is valid
    if (!day || !isValid(day)) {
      return <div className="text-center">-</div>
    }

    try {
      const dayStr = day.toISOString().split("T")[0]
      const dayData = expenseData.find((d) => d.date === dayStr)

      let filteredAmount = 0
      if (dayData) {
        let filteredExpenses = dayData.expenses || []

        // Apply filters
        if (categoryFilter !== "all") {
          filteredExpenses = filteredExpenses.filter((expense) => expense.category === categoryFilter)
        }

        if (departmentFilter !== "all") {
          filteredExpenses = filteredExpenses.filter((expense) => expense.department === departmentFilter)
        }

        filteredAmount = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
      }

      const hasExpenses = dayData && filteredAmount > 0

      return (
        <div
          className={`relative w-full h-full p-2 ${isToday(day) ? "bg-primary/10 rounded-md" : ""} ${
            selectedDate && isSameDay(day, selectedDate) ? "border-2 border-primary rounded-md" : ""
          }`}
        >
          <div className="text-center">{format(day, "d")}</div>
          {hasExpenses && (
            <div className="mt-1">
              <div className="text-xs font-medium text-center">
                ${filteredAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                <div className="h-1 w-1 rounded-full bg-primary"></div>
              </div>
            </div>
          )}
        </div>
      )
    } catch (error) {
      console.error("Error rendering day:", error, day)
      return <div className="text-center">{day ? format(day, "d") : "-"}</div>
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="month" onValueChange={(value) => setView(value as "month" | "day")}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={() => setDate(new Date(date.getFullYear(), 0, 1))}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setDate(new Date(date.getFullYear(), 11, 31))}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <Card className="flex-1">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>{format(date, "MMMM yyyy")}</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Tag className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-[140px]">
                      <Building2 className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardDescription>
                {categoryFilter !== "all" && (
                  <Badge variant="outline" className="mr-2">
                    {categoryFilter}
                  </Badge>
                )}
                {departmentFilter !== "all" && <Badge variant="outline">{departmentFilter}</Badge>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-[400px] w-full" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-destructive">{error}</p>
                </div>
              ) : (
                <TabsContent value="month" className="m-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={date}
                    onMonthChange={setDate}
                    className="rounded-md border"
                    components={{
                      Day: ({ day, ...props }) => <div {...props}>{renderDay(day)}</div>,
                    }}
                  />
                </TabsContent>
              )}

              <TabsContent value="day" className="m-0">
                {selectedDate && isValid(selectedDate) ? (
                  <div className="space-y-4">
                    <div className="text-2xl font-bold">
                      {format(selectedDate, "MMMM d, yyyy")}
                      {isToday(selectedDate) && <Badge className="ml-2">Today</Badge>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            $
                            {selectedDayTotal.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Expense Count</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{selectedDayExpenses.length}</div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Average Amount</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            $
                            {selectedDayExpenses.length > 0
                              ? (selectedDayTotal / selectedDayExpenses.length).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "0.00"}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[400px]">
                    <p className="text-muted-foreground">Select a date to view details</p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Card>

          <Card className="w-full md:w-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center">
                {selectedDate && isValid(selectedDate) ? (
                  <>
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {format(selectedDate, "MMMM d, yyyy")}
                  </>
                ) : (
                  "Select a date"
                )}
              </CardTitle>
              <CardDescription>
                {selectedDayExpenses.length > 0
                  ? `${selectedDayExpenses.length} expense${selectedDayExpenses.length > 1 ? "s" : ""}`
                  : "No expenses for this date"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <p className="text-destructive">{error}</p>
                </div>
              ) : selectedDayExpenses.length > 0 ? (
                <div className="space-y-4">
                  {selectedDayExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{expense.description}</div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          {expense.category && (
                            <Badge variant="outline" className="mr-2">
                              {expense.category}
                            </Badge>
                          )}
                          {expense.department && <span className="truncate">{expense.department}</span>}
                        </div>
                      </div>
                      <div className="font-medium">
                        $
                        {Number(expense.amount || 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  {selectedDate && isValid(selectedDate) ? (
                    <>
                      <p className="text-muted-foreground">No expenses for this date</p>
                      <Button variant="outline" className="mt-4">
                        Add Expense
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Select a date to view expenses</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  )
}
