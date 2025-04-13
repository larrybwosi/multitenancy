"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface CustomerAcquisitionChartProps {
  data: any[]
  summary: {
    totalCustomers: number
    newCustomers: number
    churnRate: string
    averageLTV: number
    acquisitionCost: string
  }
}

export function CustomerAcquisitionChart({ data, summary }: CustomerAcquisitionChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar" | "composed">("composed")

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="text-2xl font-bold">{summary.totalCustomers?.toLocaleString() || 0}</div>
          <div className="text-sm text-muted-foreground">Total Customers</div>
        </div>
        <Tabs value={chartType} onValueChange={(value) => setChartType(value as "area" | "bar" | "composed")}>
          <TabsList className="grid w-[270px] grid-cols-3">
            <TabsTrigger value="area">Area</TabsTrigger>
            <TabsTrigger value="bar">Bar</TabsTrigger>
            <TabsTrigger value="composed">Composed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart
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
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
              <Legend />
              <defs>
                <linearGradient id="colorNewCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorChurnedCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorTotalCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="newCustomers"
                name="New Customers"
                stroke="#7c3aed"
                fill="url(#colorNewCustomers)"
              />
              <Area
                type="monotone"
                dataKey="churnedCustomers"
                name="Churned Customers"
                stroke="#f97316"
                fill="url(#colorChurnedCustomers)"
              />
              <Area
                type="monotone"
                dataKey="totalCustomers"
                name="Total Customers"
                stroke="#10b981"
                fill="url(#colorTotalCustomers)"
              />
            </AreaChart>
          ) : chartType === "bar" ? (
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
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
              <Legend />
              <Bar dataKey="newCustomers" name="New Customers" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="churnedCustomers" name="Churned Customers" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="netGrowth" name="Net Growth" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <ComposedChart
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
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
              <Legend />
              <Bar yAxisId="left" dataKey="newCustomers" name="New Customers" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar
                yAxisId="left"
                dataKey="churnedCustomers"
                name="Churned Customers"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalCustomers"
                name="Total Customers"
                stroke="#10b981"
                strokeWidth={2}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="acquisitionCost"
                name="Acquisition Cost ($)"
                stroke="#0ea5e9"
                strokeWidth={2}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">New Customers</div>
            <div className="text-2xl font-bold">{summary.newCustomers?.toLocaleString() || 0}</div>
            <div className="text-sm text-green-600 mt-1">Last period</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Churn Rate</div>
            <div className="text-2xl font-bold">{summary.churnRate || "0%"}</div>
            <div className="text-sm text-amber-600 mt-1">Monthly</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Average LTV</div>
            <div className="text-2xl font-bold">{formatCurrency(summary.averageLTV || 0)}</div>
            <div className="text-sm text-muted-foreground mt-1">Lifetime value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Acquisition Cost</div>
            <div className="text-2xl font-bold">${summary.acquisitionCost || "0.00"}</div>
            <div className="text-sm text-muted-foreground mt-1">Per customer</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
