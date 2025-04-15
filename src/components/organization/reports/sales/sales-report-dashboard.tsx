"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { SalesOverviewChart } from "./sales-overview-chart"
import { TopSellingProductsTable } from "./top-selling-products-table"
import { SalesByChannelChart } from "./sales-by-channel-chart"
import { SalesByRegionChart } from "./sales-by-region-chart"

interface SalesReportDashboardProps {
  dateRange: string
}

export function SalesReportDashboard({ dateRange }: SalesReportDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [salesData, setSalesData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/reports/sales?dateRange=${dateRange}&dataType=${activeTab}`)
        const data = await response.json()
        setSalesData(data)
      } catch (error) {
        console.error("Error fetching sales data:", error)
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
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="regions">Regions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>
                View your organization's sales performance over time. Track revenue, orders, and growth.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <SalesOverviewChart data={salesData?.salesData || []} summary={salesData?.summary || {}} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>
                Analyze your best performing products by sales volume, revenue, and growth.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <TopSellingProductsTable products={salesData?.topSellingProducts || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Channel</CardTitle>
              <CardDescription>
                Analyze sales performance across different sales channels and platforms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <SalesByChannelChart data={salesData?.salesByChannel || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Region</CardTitle>
              <CardDescription>Analyze sales performance across different geographic regions.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <SalesByRegionChart data={salesData?.salesByRegion || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
