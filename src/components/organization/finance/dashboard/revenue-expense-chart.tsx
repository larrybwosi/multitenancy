"use client"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface RevenueExpenseChartProps {
  data: Array<{
    date: string
    revenue: number
    expenses: number
    profit: number
  }>
  height?: number
}

export function RevenueExpenseChart({ data, height = 300 }: RevenueExpenseChartProps) {
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

  return (
    <ChartContainer
      config={{
        revenue: {
          label: "Revenue",
          color: "hsl(var(--chart-1))",
        },
        expenses: {
          label: "Expenses",
          color: "hsl(var(--chart-2))",
        },
        profit: {
          label: "Profit",
          color: "hsl(var(--chart-3))",
        },
      }}
      className={`h-[${height}px]`}
    >
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} tickMargin={10} />
          <YAxis
            tickFormatter={formatCurrency}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            tickMargin={10}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
          <Bar dataKey="revenue" name="Revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="expenses" name="Expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} barSize={20} />
          <Line
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke="var(--color-profit)"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
