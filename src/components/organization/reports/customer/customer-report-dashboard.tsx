"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { CustomerAcquisitionChart } from "./customer-acquisition-chart"
import { CustomerSegmentationChart } from "./customer-segmentation-chart"
import { CustomerLifetimeValueTable } from "./customer-lifetime-value-table"
import { TopCustomersTable } from "./top-customers-table"
import { CustomerSatisfactionChart } from "./customer-satisfaction-chart"

interface CustomerReportDashboardProps {
  dateRange: string
}

export function CustomerReportDashboard({ dateRange }: CustomerReportDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [customerData, setCustomerData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/organization/reports/customer?dateRange=${dateRange}&dataType=${activeTab}`)
        const data = await response.json()
        setCustomerData(data)
      } catch (error) {
        console.error("Error fetching customer data:", error)
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
          <TabsTrigger value="lifetime">Lifetime Value</TabsTrigger>
          <TabsTrigger value="topCustomers">Top Customers</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Overview</CardTitle>
              <CardDescription>
                Track customer acquisition, retention, and segmentation metrics over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <div className="space-y-6">
                  <CustomerAcquisitionChart
                    data={customerData?.acquisitionData || []}
                    summary={customerData?.summary || {}}
                  />
                  <CustomerSegmentationChart data={customerData?.segmentationData || []} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifetime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Lifetime Value</CardTitle>
              <CardDescription>Analyze the long-term value of customers across different segments.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <CustomerLifetimeValueTable data={customerData?.lifetimeValueData || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topCustomers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>
                View your highest-value customers based on total spend and order frequency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <TopCustomersTable customers={customerData?.topCustomers || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satisfaction" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Satisfaction</CardTitle>
              <CardDescription>
                Track customer satisfaction metrics including NPS, CSAT, and review scores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <CustomerSatisfactionChart data={customerData?.satisfactionData || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
