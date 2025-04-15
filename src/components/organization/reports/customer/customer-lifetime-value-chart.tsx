"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"
import type { CustomerData } from "@/types/reports"

interface CustomerLifetimeValueChartProps {
  data?: CustomerData["ltv"]
}

export function CustomerLifetimeValueChart({ data }: CustomerLifetimeValueChartProps) {
  if (!data) return null

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Average Lifetime Value</div>
              <div className="text-2xl font-bold">${data.average.toLocaleString()}</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-foreground">
                Segments Performance
              </div>
              <div className="flex items-center space-x-2">
                {data.bySegment.filter(s => s.trend !== 0).map(segment => (
                  <div
                    key={segment.segment}
                    className={`flex items-center text-sm ${
                      segment.trend > 0 ? "text-green-600" : "text-red-600"
                    }`}
                    title={`${segment.segment}: ${segment.trend > 0 ? "+" : ""}${segment.trend}%`}
                  >
                    {segment.trend > 0 ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.bySegment}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                barSize={40}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="segment"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name === "value" ? "Lifetime Value" : name
                  ]}
                />
                <ReferenceLine
                  y={data.average}
                  label={{ 
                    value: "Average LTV",
                    position: "right",
                    fill: "#6b7280",
                    fontSize: 12
                  }}
                  stroke="#6b7280"
                  strokeDasharray="3 3"
                />
                <Bar
                  dataKey="value"
                  name="Lifetime Value"
                  fill={(entry: { segment: string }) => {
                    const segment = data.bySegment.find(s => s.segment === entry.segment)
                    if (!segment) return "#0ea5e9"
                    return segment.trend > 0 ? "#22c55e" : segment.trend < 0 ? "#ef4444" : "#0ea5e9"
                  }}
                  radius={[4, 4, 0, 0]}
                >
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded bg-green-500 mr-1" /> Growing Segments
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded bg-sky-500 mr-1" /> Stable Segments
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 rounded bg-red-500 mr-1" /> Declining Segments
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}