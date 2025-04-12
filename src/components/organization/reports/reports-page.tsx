"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Filter, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesReportChart } from "./sales-report-chart"
import { InventoryReportChart } from "./inventory-report-chart"
import { WarehouseUtilizationChart } from "./warehouse-utilization-chart"
import { ProductPerformanceTable } from "./product-performance-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ReportsPage() {
  const [dateRange, setDateRange] = useState("last-30-days")

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">View detailed reports and analytics for your organization</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center border rounded-md p-1 bg-white">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Last 30 Days</span>
            </Button>
            <Select defaultValue={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="border-0 w-[130px] p-1">
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                <SelectItem value="year-to-date">Year to Date</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
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

      <Tabs defaultValue="sales">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="warehouse">Warehouse</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>
                View your organization's sales performance over time. Track revenue, orders, and growth.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalesReportChart dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Levels</CardTitle>
              <CardDescription>
                Monitor inventory levels across categories. Identify trends and potential stock issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryReportChart dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouse" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Utilization</CardTitle>
              <CardDescription>
                Track warehouse capacity utilization and efficiency metrics across all locations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WarehouseUtilizationChart dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>
                Analyze the performance of your top products by sales, revenue, and growth.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductPerformanceTable dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
