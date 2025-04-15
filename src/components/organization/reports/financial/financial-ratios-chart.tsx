"use client"

import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { format } from "date-fns"

interface FinancialRatiosChartProps {
  data: Array<{
    date: string
    currentRatio: number
    quickRatio: number
    debtToEquity: number
    returnOnEquity: number
  }>
}

export function FinancialRatiosChart({ data }: FinancialRatiosChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    date: format(new Date(item.date), "MMM d"),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
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
          tickFormatter={(value) => `${value.toFixed(2)}`}
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
                            Current Ratio
                          </span>
                        </span>
                        <span className="font-medium">
                          {payload[0].value?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Quick Ratio
                          </span>
                        </span>
                        <span className="font-medium">
                          {payload[1].value?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Debt to Equity
                          </span>
                        </span>
                        <span className="font-medium">
                          {payload[2].value?.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Return on Equity
                          </span>
                        </span>
                        <span className="font-medium">
                          {payload[3].value?.toFixed(2)}%
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
        <Line
          type="monotone"
          dataKey="currentRatio"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="quickRatio"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="debtToEquity"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="returnOnEquity"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}