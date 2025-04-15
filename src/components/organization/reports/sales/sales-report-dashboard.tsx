"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesOverviewChart } from "./sales-overview-chart"
import { TopSellingProductsTable } from "./top-selling-products-table"
import { SalesByChannelChart } from "./sales-by-channel-chart"
import { SalesByRegionChart } from "./sales-by-region-chart"
import { LoadingState } from "../shared/loading-state"
import type { SalesData } from "@/types/reports"

interface SalesReportDashboardProps {
  dateRange: string
  startDate: Date
  endDate: Date
}

export function SalesReportDashboard({
  dateRange,
  startDate,
  endDate,
}: SalesReportDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<SalesData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: activeTab,
        })
        const response = await fetch(`/api/reports/sales?${params}`)
        const data = await response.json()
        setData(data)
      } catch (error) {
        console.error("Error fetching sales data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate, activeTab])

  if (isLoading) {
    return <LoadingState type={activeTab === "products" ? "table" : "chart"} />
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="regions">Regions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>
                  Sales performance and trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data && <SalesOverviewChart data={data.overview.salesData} />}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>
                  Summary of important sales metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {data && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">
                        ${data.overview.summary.totalRevenue.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">
                        {data.overview.summary.totalOrders.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Average Order Value</p>
                      <p className="text-2xl font-bold">
                        ${data.overview.summary.averageOrderValue.toLocaleString()}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      <p className="text-2xl font-bold">
                        {data.overview.summary.conversionRate}%
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>
                Analysis of top-selling products and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data && <TopSellingProductsTable products={data.products} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Channel</CardTitle>
              <CardDescription>
                Distribution of sales across different channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data && <SalesByChannelChart data={data.channels} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Region</CardTitle>
              <CardDescription>
                Geographic distribution of sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data && <SalesByRegionChart data={data.regions} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
