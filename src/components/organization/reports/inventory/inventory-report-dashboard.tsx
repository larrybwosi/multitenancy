"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryOverviewChart } from "./inventory-overview-chart"
import { InventoryTurnoverTable } from "./inventory-turnover-table"
import { LowStockItemsTable } from "./low-stock-items-table"
import { WarehouseUtilizationChart } from "./warehouse-utilization-chart"
import type { InventoryData } from "@/types/reports"

interface InventoryReportDashboardProps {
  dateRange: string
  startDate: Date
  endDate: Date
}

export function InventoryReportDashboard({
  dateRange,
  startDate,
  endDate,
}: InventoryReportDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<InventoryData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: activeTab,
        })
        const response = await fetch(`/api/reports/inventory?${params}`)
        const data = await response.json()
        setData(data)
      } catch (error) {
        console.error("Error fetching inventory data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate, activeTab])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="h-5 w-[250px] animate-pulse bg-muted rounded" />
            <div className="h-4 w-[200px] animate-pulse bg-muted rounded" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="h-full w-full animate-pulse bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="turnover">Turnover</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="warehouse">Warehouse</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Overview</CardTitle>
              <CardDescription>Current stock levels and inventory metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryOverviewChart data={data?.overview} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turnover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Turnover</CardTitle>
              <CardDescription>Analysis of inventory turnover rates by category</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTurnoverTable data={data?.turnover} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Products that need attention or restocking</CardDescription>
            </CardHeader>
            <CardContent>
              <LowStockItemsTable data={data?.lowStock} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Utilization</CardTitle>
              <CardDescription>Storage space usage and capacity analysis</CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <WarehouseUtilizationChart data={data?.warehouse} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
