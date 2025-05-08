"use client"

import { CashFlowData } from "@/types/finance"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface CashFlowChartProps {
  data: CashFlowData[]
  height?: number
}

export function CashFlowChart({ data, height = 300 }: CashFlowChartProps) {
  const chartData = data.map(item => ({
    date: item.date,
    cashIn: item.inflow,
    cashOut: item.outflow,
    netCash: item.balance,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis tickFormatter={(value) => formatCurrency(value)} />
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          labelFormatter={(label) => new Date(label).toLocaleDateString()}
        />
        <Line
          type="monotone"
          dataKey="cashIn"
          stroke="#22c55e"
          name="Cash In"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="cashOut"
          stroke="#ef4444"
          name="Cash Out"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="netCash"
          stroke="#3b82f6"
          name="Net Cash"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
