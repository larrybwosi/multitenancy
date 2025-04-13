"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

interface ExpenseBreakdownChartProps {
  data: any[]
}

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie")
  const COLORS = ["#7c3aed", "#f97316", "#10b981", "#0ea5e9", "#eab308", "#ec4899", "#8b5cf6"]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Tabs value={chartType} onValueChange={(value) => setChartType(value as "pie" | "bar")}>
          <TabsList className="grid w-[180px] grid-cols-2">
            <TabsTrigger value="pie">Pie</TabsTrigger>
            <TabsTrigger value="bar">Bar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "pie" ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}%`, "Percentage"]}
                contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <Legend layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          ) : (
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 20,
                right: 30,
                left: 100,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip
                formatter={(value) => [`${value}%`, "Percentage"]}
                contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.map((expense, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <div className="text-sm font-medium">{expense.name}</div>
              </div>
              <div className="mt-2 text-2xl font-bold">{expense.value}%</div>
              <div className="text-sm text-muted-foreground mt-1">{getExpenseDescription(expense.name)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-4 border rounded-md bg-muted/50">
        <h3 className="text-sm font-medium mb-2">Expense Management Insights</h3>
        <p className="text-sm text-muted-foreground">
          Understanding your expense breakdown helps identify cost-saving opportunities and optimize resource
          allocation. Consider benchmarking your expense ratios against industry standards to identify areas for
          improvement. Regular review of expense trends can help forecast future costs and improve budgeting accuracy.
        </p>
      </div>
    </div>
  )
}

function getExpenseDescription(expenseName: string): string {
  const descriptions: Record<string, string> = {
    "Salaries & Benefits": "Employee compensation and benefits",
    "Rent & Utilities": "Office space and utility costs",
    Marketing: "Advertising and promotional activities",
    Technology: "Software, hardware, and IT services",
    Administrative: "Office supplies and administrative costs",
    "Research & Development": "Product innovation and development",
    Other: "Miscellaneous business expenses",
  }

  return descriptions[expenseName] || "Business expense"
}
