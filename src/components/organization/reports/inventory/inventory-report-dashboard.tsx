"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { InventoryOverviewChart } from "./inventory-overview-chart"
import { InventoryTurnoverTable } from "./inventory-turnover-table"
import { LowStockItemsTable } from "./low-stock-items-table"
import { WarehouseUtilizationChart } from "./warehouse-utilization-chart"

interface InventoryReportDashboardProps {
  dateRange: string
}

export function InventoryReportDashboard({ dateRange }: InventoryReportDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [inventoryData, setInventoryData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/organization/reports/inventory?dateRange=${dateRange}&dataType=${activeTab}`)
        const data = await response.json()
        setInventoryData(data)
      } catch (error) {
        console.error("Error fetching inventory data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateRange, activeTab])

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="turnover">Turnover</TabsTrigger>
          <TabsTrigger value="lowStock">Low Stock</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Overview</CardTitle>
              <CardDescription>
                Monitor inventory levels across categories. Identify trends and potential stock issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <InventoryOverviewChart
                  inventoryData={inventoryData?.inventoryData || []}
                  categoryData={inventoryData?.categoryData || []}
                  summary={inventoryData?.summary || {}}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turnover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Turnover</CardTitle>
              <CardDescription>
                Analyze inventory turnover rates by category. Identify fast and slow-moving products.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <InventoryTurnoverTable turnoverData={inventoryData?.turnoverData || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lowStock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>View items that are running low on stock and need to be reordered.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <LowStockItemsTable lowStockItems={inventoryData?.lowStockItems || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Utilization</CardTitle>
              <CardDescription>
                Track warehouse capacity utilization and space efficiency across all locations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <WarehouseUtilizationChart warehouseData={inventoryData?.warehouseUtilization || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
