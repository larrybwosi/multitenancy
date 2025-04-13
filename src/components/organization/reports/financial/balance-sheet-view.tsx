"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { useState } from "react"

interface BalanceSheetViewProps {
  data: any
}

export function BalanceSheetView({ data }: BalanceSheetViewProps) {
  const [view, setView] = useState<"table" | "chart">("table")

  if (!data || !data.assets) {
    return <div>No balance sheet data available</div>
  }

  // Prepare data for pie charts
  const assetsData = [
    { name: "Current Assets", value: data.assets.totalCurrentAssets },
    { name: "Non-Current Assets", value: data.assets.totalNonCurrentAssets },
  ]

  const liabilitiesAndEquityData = [
    { name: "Current Liabilities", value: data.liabilities.totalCurrentLiabilities },
    { name: "Non-Current Liabilities", value: data.liabilities.totalNonCurrentLiabilities },
    { name: "Equity", value: data.equity.totalEquity },
  ]

  const COLORS = ["#7c3aed", "#f97316", "#10b981", "#0ea5e9", "#eab308"]

  return (
    <div className="space-y-4">
      <Tabs value={view} onValueChange={(value) => setView(value as "table" | "chart")}>
        <TabsList className="grid w-[200px] grid-cols-2">
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
        </TabsList>
      </Tabs>

      <TabsContent value="table" className="space-y-4">
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={2} className="bg-muted/50 font-bold">
                  Assets
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={2} className="font-medium">
                  Current Assets
                </TableCell>
              </TableRow>
              {Object.entries(data.assets.current).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="pl-8">{formatAssetName(key)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(value as number)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">Total Current Assets</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(data.assets.totalCurrentAssets)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell colSpan={2} className="font-medium">
                  Non-Current Assets
                </TableCell>
              </TableRow>
              {Object.entries(data.assets.nonCurrent).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="pl-8">{formatAssetName(key)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(value as number)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">Total Non-Current Assets</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(data.assets.totalNonCurrentAssets)}
                </TableCell>
              </TableRow>

              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">Total Assets</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(data.assets.totalAssets)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead colSpan={2} className="bg-muted/50 font-bold">
                  Liabilities & Equity
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={2} className="font-medium">
                  Current Liabilities
                </TableCell>
              </TableRow>
              {Object.entries(data.liabilities.current).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="pl-8">{formatAssetName(key)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(value as number)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">Total Current Liabilities</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(data.liabilities.totalCurrentLiabilities)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell colSpan={2} className="font-medium">
                  Non-Current Liabilities
                </TableCell>
              </TableRow>
              {Object.entries(data.liabilities.nonCurrent).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="pl-8">{formatAssetName(key)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(value as number)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">Total Non-Current Liabilities</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(data.liabilities.totalNonCurrentLiabilities)}
                </TableCell>
              </TableRow>

              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">Total Liabilities</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(data.liabilities.totalLiabilities)}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell colSpan={2} className="font-medium">
                  Equity
                </TableCell>
              </TableRow>
              {Object.entries(data.equity)
                .filter(([key]) => key !== "totalEquity")
                .map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="pl-8">{formatAssetName(key)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(value as number)}</TableCell>
                  </TableRow>
                ))}
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">Total Equity</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(data.equity.totalEquity)}</TableCell>
              </TableRow>

              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">Total Liabilities & Equity</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(data.totalLiabilitiesAndEquity)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="chart" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-4">Assets Breakdown</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {assetsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatCurrency(value as number), ""]}
                      contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center font-medium">
                Total Assets: {formatCurrency(data.assets.totalAssets)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-4">Liabilities & Equity Breakdown</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={liabilitiesAndEquityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {liabilitiesAndEquityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatCurrency(value as number), ""]}
                      contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center font-medium">
                Total Liabilities & Equity: {formatCurrency(data.totalLiabilitiesAndEquity)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Current Ratio</div>
              <div className="text-2xl font-bold">
                {(data.assets.totalCurrentAssets / data.liabilities.totalCurrentLiabilities).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Current Assets / Current Liabilities</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Debt to Equity</div>
              <div className="text-2xl font-bold">
                {(data.liabilities.totalLiabilities / data.equity.totalEquity).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Total Liabilities / Total Equity</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Working Capital</div>
              <div className="text-2xl font-bold">
                {formatCurrency(data.assets.totalCurrentAssets - data.liabilities.totalCurrentLiabilities)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Current Assets - Current Liabilities</div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </div>
  )
}

function formatAssetName(key: string): string {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/And/g, "&")
}
