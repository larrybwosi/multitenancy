"use client"

import { Card } from "@/components/ui/card"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts"
import { formatCurrency } from "@/lib/utils"

interface TotalIncomeCardProps {
  data: {
    total: number
    growth: number
    monthly: Array<{
      month: string
      amount: number
    }>
  }
}

export function TotalIncomeCard({ data }: TotalIncomeCardProps) {
  // Find the October data point for highlighting
  const octIndex = data.monthly.findIndex((item) => item.month === "Oct")
  const octData = octIndex !== -1 ? data.monthly[octIndex] : null

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Total income</h3>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold">{formatCurrency(data.total)}</p>
        <div className="flex items-center">
          <svg
            className="w-4 h-4 text-green-500 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          <span className="text-xs text-green-500">{data.growth}% vs last month</span>
        </div>
      </div>

      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data.monthly}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${Math.round(value / 1000000)}m`} />
            <Tooltip
              formatter={(value) => [formatCurrency(value as number), "Amount"]}
              contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="amount" stroke="#7c3aed" fill="url(#colorAmount)" strokeWidth={2} />
            {octData && (
              <ReferenceDot
                x={octData.month}
                y={octData.amount}
                r={6}
                fill="#ef4444"
                stroke="#fff"
                strokeWidth={2}
                label={{
                  value: formatCurrency(octData.amount),
                  position: "top",
                  fill: "#ef4444",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
