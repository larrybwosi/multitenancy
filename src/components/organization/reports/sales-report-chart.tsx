"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface SalesReportChartProps {
  dateRange: string
}

export function SalesReportChart({ dateRange }: SalesReportChartProps) {
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState<any[]>([])
  const [chartType, setChartType] = useState<"line" | "bar">("line")

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate mock data based on date range
      const data = generateMockSalesData(dateRange)
      setSalesData(data)
      setLoading(false)
    }

    fetchData()
  }, [dateRange])

  if (loading) {
    return <Skeleton className="w-full h-[400px]" />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="text-2xl font-bold">
            {formatCurrency(salesData.reduce((sum, item) => sum + item.revenue, 0))}
          </div>
          <div className="text-sm text-muted-foreground">Total Revenue</div>
        </div>
        <Tabs value={chartType} onValueChange={(value) => setChartType(value as "line" | "bar")}>
          <TabsList className="grid w-[180px] grid-cols-2">
            <TabsTrigger value="line">Line</TabsTrigger>
            <TabsTrigger value="bar">Bar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart
              data={salesData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `$${value / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}`} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "revenue") return [formatCurrency(value as number), "Revenue"]
                  return [value, name === "orders" ? "Orders" : name]
                }}
                contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#7c3aed"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart
              data={salesData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `$${value / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}`} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "revenue") return [formatCurrency(value as number), "Revenue"]
                  return [value, name === "orders" ? "Orders" : name]
                }}
                contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="orders" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Orders</div>
            <div className="text-2xl font-bold">{salesData.reduce((sum, item) => sum + item.orders, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Average Order Value</div>
            <div className="text-2xl font-bold">
              {formatCurrency(
                salesData.reduce((sum, item) => sum + item.revenue, 0) /
                  salesData.reduce((sum, item) => sum + item.orders, 0),
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Conversion Rate</div>
            <div className="text-2xl font-bold">24.8%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function generateMockSalesData(dateRange: string) {
  // Generate different data based on the selected date range
  const data = []
  let days = 30

  switch (dateRange) {
    case "last-7-days":
      days = 7
      break
    case "last-30-days":
      days = 30
      break
    case "last-90-days":
      days = 90
      break
    case "year-to-date":
      days = 365
      break
    default:
      days = 30
  }

  // Generate fewer data points for longer ranges to keep the chart readable
  const interval = days > 30 ? Math.ceil(days / 30) : 1
  const dataPoints = Math.ceil(days / interval)

  for (let i = 0; i < dataPoints; i++) {
    const date = new Date()
    date.setDate(date.getDate() - (dataPoints - i - 1) * interval)

    const revenue = 50000 + Math.random() * 100000
    const orders = 100 + Math.floor(Math.random() * 200)

    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue,
      orders,
    })
  }

  return data
}
