"use client"

import { useMemo } from "react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import type { FinancialData } from "@/types/reports"

interface ExpenseBreakdownChartProps {
  data?: FinancialData["expenses"]
}

const COLORS = ["#10b981", "#6366f1", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  if (!data) return null
  // const totalAmount = useMemo(
  //   () => data.reduce((sum, item) => sum + item.amount, 0),
  //   [data]
  // )
  return (
    <div className="h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="amount"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null
              const data = payload[0].payload
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                      {data.category}
                    </span>
                    <span className="font-bold text-muted-foreground">
                      ${data.amount.toLocaleString()} ({data.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )
            }}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            formatter={(value: string, entry: any) => (
              <span className="text-sm">
                {value} (${entry.payload.amount.toLocaleString()})
              </span>
            )}
            wrapperStyle={{
              paddingLeft: "20px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
