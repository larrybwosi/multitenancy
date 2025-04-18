"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react"

interface ExpensesStatsProps {
  expenses: any[] | undefined | null
}

export function ExpensesStats({ expenses = [] }: ExpensesStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  // Ensure expenses is an array before using reduce
  const safeExpenses = Array.isArray(expenses) ? expenses : []

  // Calculate total expenses
  const totalExpenses = safeExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate expenses by status
  const paidExpenses = safeExpenses
    .filter((expense) => expense.status?.toLowerCase() === "paid")
    .reduce((sum, expense) => sum + expense.amount, 0)

  const pendingExpenses = safeExpenses
    .filter((expense) => expense.status?.toLowerCase() === "pending")
    .reduce((sum, expense) => sum + expense.amount, 0)

  const overdueExpenses = safeExpenses
    .filter((expense) => expense.status?.toLowerCase() === "overdue")
    .reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate tax deductible expenses
  const taxDeductibleExpenses = safeExpenses
    .filter((expense) => expense.taxDeductible)
    .reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate recurring expenses
  const recurringExpenses = safeExpenses
    .filter((expense) => expense.isRecurring)
    .reduce((sum, expense) => sum + expense.amount, 0)

  // Calculate month-over-month change (mock data)
  const monthOverMonthChange = 8.3

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          {monthOverMonthChange > 0 ? (
            <TrendingUpIcon className="h-4 w-4 text-red-500" />
          ) : (
            <TrendingDownIcon className="h-4 w-4 text-green-500" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            {monthOverMonthChange > 0 ? (
              <span className="text-red-500 flex items-center">
                <ArrowUpIcon className="mr-1 h-3 w-3" />
                {monthOverMonthChange}% from last month
              </span>
            ) : (
              <span className="text-green-500 flex items-center">
                <ArrowDownIcon className="mr-1 h-3 w-3" />
                {Math.abs(monthOverMonthChange)}% from last month
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(pendingExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            {safeExpenses.filter((expense) => expense.status?.toLowerCase() === "pending").length} expenses awaiting
            approval
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tax Deductible</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(taxDeductibleExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            {totalExpenses > 0 ? ((taxDeductibleExpenses / totalExpenses) * 100).toFixed(1) : "0"}% of total expenses
          </p>
        </CardContent>
      </Card>

      <Card className="transition-all hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Recurring Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(recurringExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            {safeExpenses.filter((expense) => expense.isRecurring).length} recurring expenses
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
