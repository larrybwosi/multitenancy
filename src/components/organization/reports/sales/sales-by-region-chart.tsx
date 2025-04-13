"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SalesByRegionChartProps {
  data: any[]
}

export function SalesByRegionChart({ data }: SalesByRegionChartProps) {
  const [chartType, setChartType] = useState<"bar" | "pie">("bar")
  const COLORS = ["#7c3aed", "#f97316", "#eab308", "#06b6d4", "#14b8a6"]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Tabs value={chartType} onValueChange={(value) => setChartType(value as "bar" | "pie")}>
          <TabsList className="grid w-[180px] grid-cols-2">
            <TabsTrigger value="bar">Bar</TabsTrigger>
            <TabsTrigger value="pie">Pie</TabsTrigger>
          </TabsList>
        </Tabs>
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
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip
                formatter={(value) => [`${value}%`, "Percentage"]}
                contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <Legend />
              <Bar dataKey="value" name="Sales Percentage" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
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
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {data.map((region, index) => (
          <div key={index} className="p-4 border rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <div className="text-sm font-medium">{region.name}</div>
            </div>
            <div className="mt-2 text-2xl font-bold">{region.value}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}
