"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { format } from "date-fns"

interface BalanceSheetChartProps {
  data: Array<{
    date: string
    assets: number
    liabilities: number
    equity: number
  }>
}

export function BalanceSheetChart({ data }: BalanceSheetChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    date: format(new Date(item.date), "MMM d"),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={formattedData} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid gap-1">
                    <div className="text-xs text-muted-foreground">
                      {payload[0].payload.date}
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Assets
                          </span>
                        </span>
                        <span className="font-medium">
                          ${payload[0].value?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Liabilities
                          </span>
                        </span>
                        <span className="font-medium">
                          ${payload[1].value?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Equity
                          </span>
                        </span>
                        <span className="font-medium">
                          ${payload[2].value?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
            return null
          }}
        />
        <Bar
          dataKey="assets"
          fill="#22c55e"
          radius={[4, 4, 0, 0]}
          className="fill-primary/20"
        />
        <Bar
          dataKey="liabilities"
          fill="#ef4444"
          radius={[4, 4, 0, 0]}
          className="fill-destructive/20"
        />
        <Bar
          dataKey="equity"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
          className="fill-blue-500/20"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}