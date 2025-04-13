"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"

interface Transaction {
  id: string
  description: string
  amount: number
  type: "income" | "expense"
  date: string
  category: string
}

interface TransactionsStatsProps {
  transactions: Transaction[]
}

export function TransactionsStats({ transactions }: TransactionsStatsProps) {
  // Calculate total income
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0)

  // Calculate total expenses
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)

  // Calculate net (income - expenses)
  const netAmount = totalIncome - totalExpenses

  // Calculate percentage of income vs expenses
  const incomePercentage = totalIncome > 0 ? ((totalIncome / (totalIncome + totalExpenses)) * 100).toFixed(1) : "0"
  const expensePercentage = totalExpenses > 0 ? ((totalExpenses / (totalIncome + totalExpenses)) * 100).toFixed(1) : "0"

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <ArrowUpIcon className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">{formatCurrency(totalIncome)}</div>
          <p className="text-xs text-muted-foreground">{incomePercentage}% of total transactions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <ArrowDownIcon className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{formatCurrency(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">{expensePercentage}% of total transactions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
          {netAmount >= 0 ? (
            <TrendingUpIcon className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDownIcon className="h-4 w-4 text-red-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netAmount >= 0 ? "text-green-500" : "text-red-500"}`}>
            {formatCurrency(netAmount)}
          </div>
          <p className="text-xs text-muted-foreground">{netAmount >= 0 ? "Positive" : "Negative"} balance</p>
        </CardContent>
      </Card>
    </div>
  )
}
