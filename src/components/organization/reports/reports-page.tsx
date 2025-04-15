"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Filter, Calendar, ChevronDown } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

// Import all report components
import { SalesReportDashboard } from "./sales/sales-report-dashboard"
import { InventoryReportDashboard } from "./inventory/inventory-report-dashboard"
import { FinancialReportDashboard } from "./financial/financial-report-dashboard"
import { CustomerReportDashboard } from "./customer/customer-report-dashboard"

export function ReportsPage() {
  const [dateRange, setDateRange] = useState("last-30-days")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)))
  const [endDate, setEndDate] = useState(new Date())

  useEffect(() => {
    // Update date range when selection changes
    switch (dateRange) {
      case "today":
        setStartDate(new Date())
        setEndDate(new Date())
        break
      case "yesterday":
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        setStartDate(yesterday)
        setEndDate(yesterday)
        break
      case "last-7-days":
        setStartDate(new Date(new Date().setDate(new Date().getDate() - 7)))
        setEndDate(new Date())
        break
      case "last-30-days":
        setStartDate(new Date(new Date().setDate(new Date().getDate() - 30)))
        setEndDate(new Date())
        break
      case "this-month":
        setStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
        setEndDate(new Date())
        break
      case "last-month":
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        setStartDate(new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1))
        setEndDate(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0))
        break
      case "this-quarter":
        const quarter = Math.floor(new Date().getMonth() / 3)
        setStartDate(new Date(new Date().getFullYear(), quarter * 3, 1))
        setEndDate(new Date())
        break
      case "year-to-date":
        setStartDate(new Date(new Date().getFullYear(), 0, 1))
        setEndDate(new Date())
        break
      case "last-year":
        setStartDate(new Date(new Date().getFullYear() - 1, 0, 1))
        setEndDate(new Date(new Date().getFullYear() - 1, 11, 31))
        break
      case "custom":
        if (date) {
          setStartDate(date)
          setEndDate(date)
        }
        break
    }
  }, [dateRange, date])

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive data analysis and visualization for your organization</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{date ? format(date, "MMM d, yyyy") : "Select date"}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={date}
                onSelect={(date) => {
                  setDate(date)
                  setIsCalendarOpen(false)
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Select defaultValue={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last-7-days">Last 7 Days</SelectItem>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-quarter">This Quarter</SelectItem>
              <SelectItem value="year-to-date">Year to Date</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="customer">Customer</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <SalesReportDashboard dateRange={dateRange} startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <InventoryReportDashboard dateRange={dateRange} startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialReportDashboard dateRange={dateRange} startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="customer" className="space-y-4">
          <CustomerReportDashboard dateRange={dateRange} startDate={startDate} endDate={endDate} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
