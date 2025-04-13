"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
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

interface SalesOverviewChartProps {
  data: any[]
  summary: {
    totalRevenue: number
    totalOrders: number
    totalProfit: number
    averageOrderValue: number
    conversionRate: number
  }
}

export function SalesOverviewChart({ data, summary }: SalesOverviewChartProps) {
  const [chartType, setChartType] = useState<"line" | "bar">("line")

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue || 0)}</div>
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
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `${value / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}`} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "revenue") return [formatCurrency(value as number), "Revenue"]
                  if (name === "profit") return [formatCurrency(value as number), "Profit"]
                  return [value, name === "orders" ? "Orders" : name]
                }}
                contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#7c3aed"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="profit"
                name="Profit"
                stroke="#10b981"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
              <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#f97316" strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `${value / 1000}k`} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}`} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "revenue") return [formatCurrency(value as number), "Revenue"]
                  if (name === "profit") return [formatCurrency(value as number), "Profit"]
                  return [value, name === "orders" ? "Orders" : name]
                }}
                contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Orders</div>
            <div className="text-2xl font-bold">{summary.totalOrders?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Average Order Value</div>
            <div className="text-2xl font-bold">{formatCurrency(summary.averageOrderValue || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Profit</div>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalProfit || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Conversion Rate</div>
            <div className="text-2xl font-bold">{summary.conversionRate?.toFixed(1) || 0}%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
