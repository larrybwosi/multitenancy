"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { formatCurrency } from "@/lib/utils"

interface CashFlowChartProps {
  data: any[]
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  // Calculate totals for summary cards
  const totalOperatingCashFlow = data.reduce((sum, item) => sum + item.operatingCashFlow, 0)
  const totalInvestingCashFlow = data.reduce((sum, item) => sum + item.investingCashFlow, 0)
  const totalFinancingCashFlow = data.reduce((sum, item) => sum + item.financingCashFlow, 0)
  const totalNetCashFlow = data.reduce((sum, item) => sum + item.netCashFlow, 0)

  return (
    <div className="space-y-4">
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
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
            <ReferenceLine y={0} stroke="#000" />
            <Bar dataKey="operatingCashFlow" name="Operating Cash Flow" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="investingCashFlow" name="Investing Cash Flow" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="financingCashFlow" name="Financing Cash Flow" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="netCashFlow" name="Net Cash Flow" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Operating Cash Flow</div>
            <div className="text-2xl font-bold">{formatCurrency(totalOperatingCashFlow)}</div>
            <div className="text-sm text-green-600 mt-1">Business operations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Investing Cash Flow</div>
            <div className="text-2xl font-bold">{formatCurrency(totalInvestingCashFlow)}</div>
            <div className="text-sm text-amber-600 mt-1">Asset investments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Financing Cash Flow</div>
            <div className="text-2xl font-bold">{formatCurrency(totalFinancingCashFlow)}</div>
            <div className="text-sm text-purple-600 mt-1">Debt and equity</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Net Cash Flow</div>
            <div className="text-2xl font-bold">{formatCurrency(totalNetCashFlow)}</div>
            <div className={`text-sm ${totalNetCashFlow >= 0 ? "text-green-600" : "text-red-600"} mt-1`}>
              {totalNetCashFlow >= 0 ? "Positive cash flow" : "Negative cash flow"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 border rounded-md bg-muted/50">
        <h3 className="text-sm font-medium mb-2">About Cash Flow</h3>
        <p className="text-sm text-muted-foreground">
          The cash flow statement shows how changes in balance sheet accounts and income affect cash and cash
          equivalents. It breaks down the analysis to operating, investing, and financing activities. Positive operating
          cash flow is generally a good sign of a healthy business, while negative investing cash flow often indicates
          the company is investing in its future growth.
        </p>
      </div>
    </div>
  )
}
