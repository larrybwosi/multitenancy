"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type IncomeData = {
  saleDate: string
  _sum: {
    finalAmount: number
  }
}

interface TotalIncomeCardProps {
  data: IncomeData[]
}

export function TotalIncomeCard({ data }: TotalIncomeCardProps) {
  // Process data for chart
  const processedData = data.map(entry => ({
    date: new Date(entry.saleDate).toLocaleDateString(),
    amount: entry._sum.finalAmount
  }))

  // Calculate total income
  const totalIncome = data.reduce((sum, entry) => sum + entry._sum.finalAmount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Total Income</span>
          <span className="text-lg font-semibold text-green-600">
            ${totalIncome.toLocaleString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
