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

type PayrollData = {
  expenseDate: string
  _sum: {
    amount: number
  }
}

interface PayrollSummaryCardProps {
  data: PayrollData[]
}

export function PayrollSummaryCard({ data }: PayrollSummaryCardProps) {
  // Process data for chart
  const processedData = data.map(entry => ({
    date: new Date(entry.expenseDate).toLocaleDateString(),
    amount: entry._sum.amount
  }))

  // Calculate total payroll
  const totalPayroll = data.reduce((sum, entry) => sum + entry._sum.amount, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Payroll Summary</span>
          <span className="text-lg font-semibold">
            ${totalPayroll.toLocaleString()}
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
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
