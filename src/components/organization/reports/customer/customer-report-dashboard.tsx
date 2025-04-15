"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerOverviewChart } from "./customer-overview-chart"
import { CustomerRetentionChart } from "./customer-retention-chart"
import { CustomerSegmentsTable } from "./customer-segments-table"
import { CustomerLifetimeValueChart } from "./customer-lifetime-value-chart"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { CustomerData } from "@/types/reports"
import { RefreshCcw } from "lucide-react"

interface CustomerReportDashboardProps {
  dateRange: string
  startDate: Date
  endDate: Date
}

export function CustomerReportDashboard({
  dateRange,
  startDate,
  endDate,
}: CustomerReportDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CustomerData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: activeTab,
        })
        const response = await fetch(`/api/reports/customers?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch customer data')
        }
        const data = await response.json()
        setData(data)
      } catch (error) {
        console.error("Error fetching customer data:", error)
        setError(error instanceof Error ? error.message : 'An error occurred while fetching data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate, activeTab])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="h-5 w-[250px] animate-pulse bg-muted rounded" />
            <div className="h-4 w-[200px] animate-pulse bg-muted rounded" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="lifetime-value">Lifetime Value</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Overview</CardTitle>
              <CardDescription>Key customer metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerOverviewChart data={data?.overview} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Retention</CardTitle>
              <CardDescription>Cohort analysis and retention rates</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerRetentionChart data={data?.retention} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
              <CardDescription>Analysis of customer segments and behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerSegmentsTable data={data?.segments} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifetime-value" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Lifetime Value</CardTitle>
              <CardDescription>LTV analysis by customer segment</CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerLifetimeValueChart data={data?.ltv} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
