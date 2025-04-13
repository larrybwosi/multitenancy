"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfitLossChart } from "./profit-loss-chart"
import { CashFlowChart } from "./cash-flow-chart"
import { BalanceSheetView } from "./balance-sheet-view"
import { ExpenseBreakdownChart } from "./expense-breakdown-chart"
import { FinancialRatiosTable } from "./financial-ratios-table"

interface FinancialReportDashboardProps {
  dateRange: string
}

export function FinancialReportDashboard({ dateRange }: FinancialReportDashboardProps) {
  const [activeTab, setActiveTab] = useState("profitLoss")
  const [isLoading, setIsLoading] = useState(true)
  const [financialData, setFinancialData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/organization/reports/financial?dateRange=${dateRange}&dataType=${activeTab}`)
        const data = await response.json()
        setFinancialData(data)
      } catch (error) {
        console.error("Error fetching financial data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [dateRange, activeTab])

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profitLoss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="cashFlow">Cash Flow</TabsTrigger>
          <TabsTrigger value="balanceSheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="ratios">Financial Ratios</TabsTrigger>
        </TabsList>

        <TabsContent value="profitLoss" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>
                View your organization's revenue, expenses, and profitability over time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <ProfitLossChart data={financialData?.profitLossData || []} summary={financialData?.summary || {}} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashFlow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>
                Track the flow of cash in and out of your business across different activities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <CashFlowChart data={financialData?.cashFlowData || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balanceSheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>
                View your organization's assets, liabilities, and equity at a specific point in time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <BalanceSheetView data={financialData?.balanceSheet || {}} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
              <CardDescription>
                Analyze your organization's expenses by category to identify cost-saving opportunities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <ExpenseBreakdownChart data={financialData?.expenseBreakdown || []} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ratios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Ratios</CardTitle>
              <CardDescription>
                View key financial ratios to assess your organization's financial health and performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="w-full h-[400px]" />
              ) : (
                <FinancialRatiosTable ratios={financialData?.financialRatios || {}} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
