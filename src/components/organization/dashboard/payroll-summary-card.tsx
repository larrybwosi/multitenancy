"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps
} from "recharts"
import { DollarSign, Wallet } from "lucide-react"
import { format } from "date-fns"

type PayrollData = {
  expenseDate: string
  _sum: {
    amount: number
  }
}

interface PayrollSummaryCardProps {
  data: PayrollData[]
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-md text-xs">
        <p className="font-medium">{label}</p>
        <p className="text-blue-600 font-semibold">${payload[0].value?.toLocaleString()}</p>
      </div>
    );
  }

  return null;
};

export function PayrollSummaryCard({ data }: PayrollSummaryCardProps) {
  // Process data for chart
  const processedData = data.map(entry => ({
    date: format(new Date(entry.expenseDate), 'MMM dd'),
    amount: entry._sum.amount
  }))

  // Calculate total payroll
  const totalPayroll = data.reduce((sum, entry) => sum + entry._sum.amount, 0)
  
  // Calculate average payroll
  const averagePayroll = data.length > 0 ? totalPayroll / data.length : 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900">
              <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
            <span>Payroll Summary</span>
          </div>
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            ${totalPayroll.toLocaleString()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#ccc', opacity: 0.3 }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={averagePayroll}
                stroke="#4f46e5"
                strokeDasharray="3 3"
                label={{ 
                  value: 'Avg', 
                  position: 'right',
                  fill: '#4f46e5',
                  fontSize: 10
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ stroke: '#3b82f6', strokeWidth: 1, r: 3, fill: '#fff' }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 1, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="p-2 rounded-md bg-gray-50 dark:bg-gray-800 text-xs">
            <p className="text-muted-foreground">Average Payroll</p>
            <div className="flex items-center mt-1 font-medium">
              <DollarSign className="h-3 w-3 mr-1" />
              <span>{averagePayroll.toLocaleString()}</span>
            </div>
          </div>
          <div className="p-2 rounded-md bg-gray-50 dark:bg-gray-800 text-xs">
            <p className="text-muted-foreground">Payment Frequency</p>
            <div className="flex items-center mt-1 font-medium">
              <span>{data.length} payment{data.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
