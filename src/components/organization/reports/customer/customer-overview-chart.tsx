"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"
import type { CustomerData } from "@/types/reports"

interface CustomerOverviewChartProps {
  data?: CustomerData["overview"]
}

export function CustomerOverviewChart({ data }: CustomerOverviewChartProps) {
  if (!data) return null

  const metrics = [
    {
      title: "Total Customers",
      value: data.metrics.totalCustomers,
      trend: data.chart[data.chart.length - 1].active - data.chart[0].active,
    },
    {
      title: "Active Customers",
      value: data.metrics.activeCustomers,
      trend: data.chart[data.chart.length - 1].active - data.chart[0].active,
    },
    {
      title: "New Customers",
      value: data.metrics.newCustomers,
      trend: data.chart[data.chart.length - 1].new - data.chart[0].new,
    },
    {
      title: "Churned Customers",
      value: data.metrics.churned,
      trend: data.chart[data.chart.length - 1].churned - data.chart[0].churned,
      isNegative: true, // Lower churn is better
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground">{metric.title}</div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
                <div className={`flex items-center text-sm ${
                  metric.trend === 0 
                    ? "text-muted-foreground" 
                    : metric.isNegative 
                      ? (metric.trend > 0 ? "text-red-600" : "text-green-600")
                      : (metric.trend > 0 ? "text-green-600" : "text-red-600")
                }`}>
                  {metric.trend > 0 ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : metric.trend < 0 ? (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  ) : null}
                  {Math.abs(metric.trend)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.chart}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="newGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="churnedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="active"
                  name="Active Customers"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#activeGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="new"
                  name="New Customers"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#newGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="churned"
                  name="Churned Customers"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#churnedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}