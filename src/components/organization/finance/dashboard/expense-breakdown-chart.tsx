"use client"

import { ChartContainer } from "@/components/ui/chart"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

interface ExpenseBreakdownChartProps {
  data: Array<{
    category: string
    amount: number
  }>
  height?: number
}

export function ExpenseBreakdownChart({ data, height = 300 }: ExpenseBreakdownChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const COLORS = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--chart-6)",
    "var(--chart-7)",
    "var(--chart-8)",
    "var(--chart-9)",
    "var(--chart-10)",
  ]

  const totalExpenses = data.reduce((sum, item) => sum + item.amount, 0)

  // Add percentage to each item
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: ((item.amount / totalExpenses) * 100).toFixed(1),
  }))

  return (
    <div className="h-full">
      <ChartContainer config={{}} className={`h-[${height}px]`}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={dataWithPercentage}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="amount"
              nameKey="category"
              label={({ name, percentage }) => `${name}: ${percentage}%`}
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              iconSize={8}
              formatter={(value, entry, index) => (
                <span className="text-sm">
                  {value} ({dataWithPercentage[index]?.percentage}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
