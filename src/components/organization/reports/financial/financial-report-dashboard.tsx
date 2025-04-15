"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfitLossChart } from "./profit-loss-chart"
import { CashFlowChart } from "./cash-flow-chart"
import { BalanceSheetTable } from "./balance-sheet-table"
import { FinancialMetricsGrid } from "./financial-metrics-grid"
import { LoadingState } from "../shared/loading-state"
import type { FinancialData } from "@/types/reports"

interface FinancialReportDashboardProps {
  dateRange: string
  startDate: Date
  endDate: Date
}

export function FinancialReportDashboard({
  dateRange,
  startDate,
  endDate,
}: FinancialReportDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<FinancialData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: activeTab,
        })
        const response = await fetch(`/api/reports/financial?${params}`)
        const data = await response.json()
        setData(data)
      } catch (error) {
        console.error("Error fetching financial data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate, activeTab])

  if (isLoading) {
    return <LoadingState type={activeTab === "balance-sheet" ? "table" : "chart"} />
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Profit & Loss</CardTitle>
                <CardDescription>Overview of revenue and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                {data && (
                  <div className="space-y-4">
                    <ProfitLossChart data={data.profitLoss.data} />
                    <FinancialMetricsGrid metrics={[
                      {
                        label: "Total Revenue",
                        value: `$${data.profitLoss.summary.totalRevenue.toLocaleString()}`,
                      },
                      {
                        label: "Total Expenses",
                        value: `$${data.profitLoss.summary.totalExpenses.toLocaleString()}`,
                      },
                      {
                        label: "Net Profit",
                        value: `$${data.profitLoss.summary.netProfit.toLocaleString()}`,
                      },
                      {
                        label: "Profit Margin",
                        value: `${data.profitLoss.summary.profitMargin}%`,
                      },
                    ]} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cash Flow</CardTitle>
                <CardDescription>Cash movement analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {data && <CashFlowChart data={data.cashFlow} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Ratios</CardTitle>
                <CardDescription>Important financial indicators</CardDescription>
              </CardHeader>
              <CardContent>
                {data && (
                  <div className="space-y-4">
                    {data.ratios.map((ratio) => (
                      <div
                        key={ratio.name}
                        className="flex items-center justify-between space-x-4"
                      >
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">{ratio.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {ratio.description}
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${
                          ratio.status === "good"
                            ? "text-green-500"
                            : ratio.status === "warning"
                            ? "text-yellow-500"
                            : "text-red-500"
                        }`}>
                          {ratio.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profit-loss">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>
                Detailed breakdown of revenue and expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data && (
                <div className="space-y-8">
                  <ProfitLossChart data={data.profitLoss.data} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FinancialMetricsGrid metrics={[
                          {
                            label: "Total Revenue",
                            value: `$${data.profitLoss.summary.totalRevenue.toLocaleString()}`,
                          },
                          {
                            label: "Total Expenses",
                            value: `$${data.profitLoss.summary.totalExpenses.toLocaleString()}`,
                          },
                          {
                            label: "Net Profit",
                            value: `$${data.profitLoss.summary.netProfit.toLocaleString()}`,
                          },
                          {
                            label: "Profit Margin",
                            value: `${data.profitLoss.summary.profitMargin}%`,
                          },
                        ]} />
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Expenses Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {data.expenses.map((expense) => (
                            <div
                              key={expense.category}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm">{expense.category}</span>
                              <span className="text-sm font-medium">
                                ${expense.amount.toLocaleString()} ({expense.percentage}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash-flow">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>
                Analysis of cash inflows and outflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data && <CashFlowChart data={data.cashFlow} height={400} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet">
          <Card>
            <CardHeader>
              <CardTitle>Balance Sheet</CardTitle>
              <CardDescription>
                Statement of assets, liabilities, and equity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data && <BalanceSheetTable data={data.balanceSheet} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
