"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatCurrency } from "@/lib/utils"
import { ArrowUp, ArrowDown } from "lucide-react"

interface ProfitLossChartProps {
  data: any[]
  summary: {
    revenue: number
    netProfit: number
    grossMargin: string
    netMargin: string
    revenueGrowth: string
    profitGrowth: string
  }
}

export function ProfitLossChart({ data, summary }: ProfitLossChartProps) {
  const [chartType, setChartType] = useState<"line" | "bar">("bar")
  const [dataView, setDataView] = useState<"revenue" | "profit">("revenue")

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="space-y-1">
          <div className="text-2xl font-bold">{formatCurrency(summary.revenue || 0)}</div>
          <div className="text-sm text-muted-foreground">Total Revenue</div>
        </div>
        <div className="flex gap-2">
          <Tabs value={dataView} onValueChange={(value) => setDataView(value as "revenue" | "profit")}>
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="profit">Profit</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs value={chartType} onValueChange={(value) => setChartType(value as "line" | "bar")}>
            <TabsList className="grid w-[120px] grid-cols-2">
              <TabsTrigger value="bar">Bar</TabsTrigger>
              <TabsTrigger value="line">Line</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip
                formatter={(value) => [formatCurrency(value as number), ""]}
                contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <Legend />
              {dataView === "revenue" ? (
                <>
                  <Bar dataKey="revenue" name="Revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="costOfSales" name="Cost of Sales" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="grossProfit" name="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                </>
              ) : (
                <>
                  <Bar dataKey="grossProfit" name="Gross Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="operatingExpenses" name="Operating Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netProfit" name="Net Profit" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </>
              )}
            </BarChart>
          ) : (
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip
                formatter={(value) => [formatCurrency(value as number), ""]}
                contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <Legend />
              {dataView === "revenue" ? (
                <>
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#7c3aed" strokeWidth={2} />
                  <Line type="monotone" dataKey="costOfSales" name="Cost of Sales" stroke="#f97316" strokeWidth={2} />
                  <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#10b981" strokeWidth={2} />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#10b981" strokeWidth={2} />
                  <Line
                    type="monotone"
                    dataKey="operatingExpenses"
                    name="Operating Expenses"
                    stroke="#f97316"
                    strokeWidth={2}
                  />
                  <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#7c3aed" strokeWidth={2} />
                </>
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Net Profit</div>
            <div className="text-2xl font-bold">{formatCurrency(summary.netProfit || 0)}</div>
            <div className="flex items-center mt-1 text-sm">
              {summary.profitGrowth && summary.profitGrowth !== "N/A" && (
                <>
                  {summary.profitGrowth.startsWith("-") ? (
                    <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                  ) : (
                    <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                  )}
                  <span className={summary.profitGrowth.startsWith("-") ? "text-red-500" : "text-green-500"}>
                    {summary.profitGrowth}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Gross Margin</div>
            <div className="text-2xl font-bold">{summary.grossMargin || "0%"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Net Margin</div>
            <div className="text-2xl font-bold">{summary.netMargin || "0%"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Revenue Growth</div>
            <div className="text-2xl font-bold">{summary.revenueGrowth || "0%"}</div>
            <div className="flex items-center mt-1 text-sm">
              {summary.revenueGrowth && summary.revenueGrowth !== "N/A" && (
                <>
                  {summary.revenueGrowth.startsWith("-") ? (
                    <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                  ) : (
                    <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
