"use client"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface CashFlowChartProps {
  data: Array<{
    date: string
    cashIn: number
    cashOut: number
    netCash: number
  }>
}

export function CashFlowChart({ data }: CashFlowChartProps) {
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
        cashIn: {
          label: "Cash In",
          color: "hsl(var(--chart-1))",
        },
        cashOut: {
          label: "Cash Out",
          color: "hsl(var(--chart-2))",
        },
        netCash: {
          label: "Net Cash",
          color: "hsl(var(--chart-3))",
        },
      }}
      className="h-[500px]"
    >
      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
          <defs>
            <linearGradient id="colorCashIn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-cashIn)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-cashIn)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorCashOut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-cashOut)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-cashOut)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="cashIn"
            name="Cash In"
            stroke="var(--color-cashIn)"
            fillOpacity={1}
            fill="url(#colorCashIn)"
          />
          <Area
            type="monotone"
            dataKey="cashOut"
            name="Cash Out"
            stroke="var(--color-cashOut)"
            fillOpacity={1}
            fill="url(#colorCashOut)"
          />
          <Line
            type="monotone"
            dataKey="netCash"
            name="Net Cash"
            stroke="var(--color-netCash)"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
