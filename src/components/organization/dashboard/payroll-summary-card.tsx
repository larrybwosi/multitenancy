"use client"

import { Card } from "@/components/ui/card"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface PayrollSummaryCardProps {
  data: Array<{
    month: string
    netSalary: number
    tax: number
    loan: number
  }>
}

export function PayrollSummaryCard({ data }: PayrollSummaryCardProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Annual payroll summary</h3>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
            <Tooltip
              formatter={(value) => [`$${value.toLocaleString()}`, ""]}
              contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <Legend />
            <Bar dataKey="netSalary" stackId="a" name="Net Salary" fill="#ef4444" />
            <Bar dataKey="tax" stackId="a" name="Tax" fill="#eab308" />
            <Bar dataKey="loan" stackId="a" name="Loan" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
