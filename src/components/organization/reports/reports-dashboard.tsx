"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesReportDashboard } from "./sales/sales-report-dashboard"
import { FinancialReportDashboard } from "./financial/financial-report-dashboard"
import { InventoryReportDashboard } from "./inventory/inventory-report-dashboard"
import { CustomerReportDashboard } from "./customer/customer-report-dashboard"
import { DateRangePicker } from "./shared/date-range-picker"

export function ReportsDashboard() {
  const [activeTab, setActiveTab] = React.useState("sales")
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <DateRangePicker date={date} onDateChange={setDate} />
      </div>

      <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Reports</CardTitle>
              <CardDescription>
                Analyze your sales performance, trends, and key metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <SalesReportDashboard
                dateRange="custom"
                startDate={date?.from || new Date()}
                endDate={date?.to || new Date()}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription>
                Track your financial health, profitability, and cash flow
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <FinancialReportDashboard
                dateRange="custom"
                startDate={date?.from || new Date()}
                endDate={date?.to || new Date()}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Reports</CardTitle>
              <CardDescription>
                Monitor stock levels, turnover, and warehouse utilization
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <InventoryReportDashboard
                dateRange="custom"
                startDate={date?.from || new Date()}
                endDate={date?.to || new Date()}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reports</CardTitle>
              <CardDescription>
                Understand customer behavior, retention, and lifetime value
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <CustomerReportDashboard
                dateRange="custom"
                startDate={date?.from || new Date()}
                endDate={date?.to || new Date()}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}