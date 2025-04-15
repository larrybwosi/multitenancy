"use client"

import {
  Bar,
  ComposedChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { format } from "date-fns"

interface ProfitLossChartProps {
  data: Array<{
    date: string
    revenue: number
    expenses: number
    profit: number
  }>
}

export function ProfitLossChart({ data }: ProfitLossChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    date: format(new Date(item.date), "MMM d"),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={formattedData} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          yAxisId="left"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload) return null
            return (
              <div className="rounded-lg border bg-background p-2 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                      Revenue
                    </span>
                    <span className="font-bold text-green-500">
                      ${payload[0]?.value?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                      Expenses
                    </span>
                    <span className="font-bold text-red-500">
                      ${payload[1]?.value?.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[0.70rem] uppercase text-muted-foreground">
                    Net Profit
                  </span>
                  <span className="font-bold text-blue-500">
                    ${payload[2]?.value?.toLocaleString()}
                  </span>
                </div>
              </div>
            )
          }}
        />
        <Bar
          yAxisId="left"
          dataKey="revenue"
          fill="hsl(142.1 76.2% 36.3%)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          yAxisId="left"
          dataKey="expenses"
          fill="hsl(346.8 77.2% 49.8%)"
          radius={[4, 4, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="profit"
          stroke="currentColor"
          className="stroke-blue-500"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
