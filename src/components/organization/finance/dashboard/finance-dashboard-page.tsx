"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { FinancialSummaryCards } from "./financial-summary-cards"
import { RevenueExpenseChart } from "./revenue-expense-chart"
import { CashFlowChart } from "./cash-flow-chart"
import { ExpenseBreakdownChart } from "./expense-breakdown-chart"
import { RecentTransactionsTable } from "./recent-transactions-table"
import { UpcomingPaymentsTable } from "./upcoming-payments-table"
import { DashboardData, Period } from "@/types/finance"

const fetchDashboardData = async (period: Period): Promise<DashboardData> => {
  const response = await fetch(`/api/organization/finance/dashboard?period=${period}`)
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }
  return response.json()
}

export function FinanceDashboardPage() {
  const [period, setPeriod] = useState<Period>("month")

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard', period],
    queryFn: () => fetchDashboardData(period),
  })

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-600">Error Loading Dashboard</h2>
          <p className="mt-2 text-gray-600">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your organization's financial performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(value: Period) => setPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="quarter">Quarterly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="mt-2 h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <FinancialSummaryCards data={dashboardData?.summary} />
        </motion.div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue-expense">Revenue & Expenses</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          <TabsTrigger value="expense-breakdown">Expense Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Revenue vs Expenses</CardTitle>
                <CardDescription>Compare your revenue and expenses over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <RevenueExpenseChart data={dashboardData?.profitLoss || []} />
                )}
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
                <CardDescription>See where your money is being spent</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ExpenseBreakdownChart data={dashboardData?.expensesByCategory || []} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your most recent financial transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <RecentTransactionsTable transactions={dashboardData?.recentTransactions || []} />
                )}
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Upcoming Payments</CardTitle>
                <CardDescription>Payments due in the near future</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <UpcomingPaymentsTable payments={dashboardData?.upcomingPayments || []} />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue-expense">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Revenue & Expenses</CardTitle>
              <CardDescription>Detailed view of your revenue and expenses over time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[500px] w-full" />
              ) : (
                <RevenueExpenseChart data={dashboardData?.profitLoss || []} height={500} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Cash Flow</CardTitle>
              <CardDescription>Track your cash inflows and outflows over time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[500px] w-full" />
              ) : (
                <CashFlowChart data={dashboardData?.cashFlow || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expense-breakdown">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>Detailed analysis of your expenses by category</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[500px] w-full" />
              ) : (
                <ExpenseBreakdownChart data={dashboardData?.expensesByCategory || []} height={500} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
