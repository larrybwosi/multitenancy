"use client"

import { Card, CardContent } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface CustomerSegmentationChartProps {
  data: any[]
}

export function CustomerSegmentationChart({ data }: CustomerSegmentationChartProps) {
  const COLORS = ["#7c3aed", "#f97316", "#10b981", "#0ea5e9", "#eab308"]

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Customer Segmentation</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-[300px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
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
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Segment Characteristics</h3>
          <div className="grid grid-cols-1 gap-4">
            {data.map((segment, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">{segment.name}</div>
                      <div className="text-2xl font-bold">{segment.value}%</div>
                    </div>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{getSegmentDescription(segment.name)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function getSegmentDescription(segmentName: string): string {
  const descriptions: Record<string, string> = {
    "New Customers": "Customers who made their first purchase within the last 3 months",
    Occasional: "Customers who purchase 1-3 times per year with moderate basket size",
    Regular: "Customers who purchase 4-8 times per year with good basket size",
    Loyal: "Customers who purchase 9+ times per year with high basket size",
    VIP: "Top customers with highest frequency and value of purchases",
  }

  return descriptions[segmentName] || "Customer segment"
}
