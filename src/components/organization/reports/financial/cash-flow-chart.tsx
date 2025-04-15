"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { format } from "date-fns"

interface CashFlowChartProps {
  data: Array<{
    date: string
    operatingCashFlow: number
    investingCashFlow: number
    financingCashFlow: number
    netCashFlow: number
  }>
  height?: number
}

export function CashFlowChart({ data, height = 300 }: CashFlowChartProps) {
  // Calculate totals for summary cards
  const totalOperatingCashFlow = data.reduce((sum, item) => sum + item.operatingCashFlow, 0)
  const totalInvestingCashFlow = data.reduce((sum, item) => sum + item.investingCashFlow, 0)
  const totalFinancingCashFlow = data.reduce((sum, item) => sum + item.financingCashFlow, 0)
  const totalNetCashFlow = data.reduce((sum, item) => sum + item.netCashFlow, 0)

  const formattedData = data.map((item) => ({
    ...item,
    date: format(new Date(item.date), "MMM d"),
  }))

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-3">
          <div className="text-sm font-medium text-muted-foreground">Operating Cash Flow</div>
          <div className="text-2xl font-bold">
            ${Math.abs(totalOperatingCashFlow).toLocaleString()}
          </div>
          <div className={`text-sm ${totalOperatingCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
            {totalOperatingCashFlow >= 0 ? "Positive" : "Negative"} cash flow
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-sm font-medium text-muted-foreground">Investing Cash Flow</div>
          <div className="text-2xl font-bold">
            ${Math.abs(totalInvestingCashFlow).toLocaleString()}
          </div>
          <div className={`text-sm ${totalInvestingCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
            {totalInvestingCashFlow >= 0 ? "Positive" : "Negative"} cash flow
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-sm font-medium text-muted-foreground">Financing Cash Flow</div>
          <div className="text-2xl font-bold">
            ${Math.abs(totalFinancingCashFlow).toLocaleString()}
          </div>
          <div className={`text-sm ${totalFinancingCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
            {totalFinancingCashFlow >= 0 ? "Positive" : "Negative"} cash flow
          </div>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-sm font-medium text-muted-foreground">Net Cash Flow</div>
          <div className="text-2xl font-bold">${Math.abs(totalNetCashFlow).toLocaleString()}</div>
          <div className={`text-sm ${totalNetCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
            {totalNetCashFlow >= 0 ? "Positive" : "Negative"} cash flow
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={formattedData} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="operatingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="investingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="financingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload) return null
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid gap-2">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Operating
                      </span>
                      <span className="font-bold text-green-500">
                        ${payload[0]?.value?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Investing
                      </span>
                      <span className="font-bold text-red-500">
                        ${payload[1]?.value?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Financing
                      </span>
                      <span className="font-bold text-indigo-500">
                        ${payload[2]?.value?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )
            }}
          />
          <Area
            type="monotone"
            dataKey="operatingCashFlow"
            stroke="#22c55e"
            fill="url(#operatingGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="investingCashFlow"
            stroke="#ef4444"
            fill="url(#investingGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="financingCashFlow"
            stroke="#6366f1"
            fill="url(#financingGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      <p className="text-sm text-muted-foreground">
        The cash flow statement shows how changes in balance sheet accounts and income affect cash and cash equivalents. 
        It breaks down the analysis to operating, investing, and financing activities. 
        Positive operating cash flow is generally a good sign of a healthy business, while negative investing cash flow often indicates the company is investing in its future growth.
      </p>
    </div>
  )
}
