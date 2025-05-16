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
  TooltipProps
} from "recharts"
import { Banknote, TrendingUp } from "lucide-react"
import { format } from "date-fns"

type IncomeData = {
  saleDate: string
  _sum: {
    finalAmount: number
  }
}

interface TotalIncomeCardProps {
  data: IncomeData[]
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-md text-xs">
        <p className="font-medium">{label}</p>
        <p className="text-green-600 font-semibold">${payload[0].value?.toLocaleString()}</p>
      </div>
    );
  }

  return null;
};

export function TotalIncomeCard({ data }: TotalIncomeCardProps) {
  // Process data for chart
  const processedData = data.map(entry => ({
    date: format(new Date(entry.saleDate), 'MMM dd'),
    amount: entry._sum.finalAmount,
    fullDate: new Date(entry.saleDate).toLocaleDateString()
  }))

  // Calculate total income
  const totalIncome = data.reduce((sum, entry) => sum + entry._sum.finalAmount, 0)
  
  // Calculate month-over-month change
  const sortedData = [...data].sort((a, b) => 
    new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime()
  )
  
  const previousMonthIncome = sortedData.length > 1 ? 
    sortedData.slice(0, Math.floor(sortedData.length / 2)).reduce((sum, entry) => sum + entry._sum.finalAmount, 0) : 0
  
  const currentMonthIncome = sortedData.length > 1 ? 
    sortedData.slice(Math.floor(sortedData.length / 2)).reduce((sum, entry) => sum + entry._sum.finalAmount, 0) : totalIncome
  
  const percentChange = previousMonthIncome > 0 
    ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100 
    : 0

  // Find highest and lowest income days
  let highestIncome = { date: '', amount: 0 }
  let lowestIncome = { date: '', amount: Number.MAX_VALUE }
  
  processedData.forEach(day => {
    if (day.amount > highestIncome.amount) {
      highestIncome = { date: day.fullDate, amount: day.amount }
    }
    if (day.amount < lowestIncome.amount) {
      lowestIncome = { date: day.fullDate, amount: day.amount }
    }
  })
  
  if (lowestIncome.amount === Number.MAX_VALUE) {
    lowestIncome = { date: 'N/A', amount: 0 }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900">
              <Banknote className="h-4 w-4 text-green-600 dark:text-green-300" />
            </div>
            <span>Income Overview</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
              ${totalIncome.toLocaleString()}
            </span>
            <div className="flex items-center text-xs">
              {percentChange > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingUp className="h-3 w-3 text-red-500 mr-1 rotate-180" />
              )}
              <span className={percentChange >= 0 ? "text-green-500" : "text-red-500"}>
                {percentChange >= 0 ? "+" : ""}{Math.round(percentChange)}%
              </span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={processedData}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorIncome)"
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 1, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-2 text-xs">
          <div className="p-2 rounded-md bg-green-50 dark:bg-green-900/20">
            <p className="text-muted-foreground">Best Day</p>
            <p className="font-medium">{highestIncome.date}</p>
            <p className="text-green-600 font-semibold">${highestIncome.amount.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/20">
            <p className="text-muted-foreground">Lowest Day</p>
            <p className="font-medium">{lowestIncome.date}</p>
            <p className="text-red-500 font-semibold">${lowestIncome.amount.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
