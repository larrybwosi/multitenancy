"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent } from "@/components/ui/card"

interface SalesByChannelChartProps {
  data: any[]
}

export function SalesByChannelChart({ data }: SalesByChannelChartProps) {
  const COLORS = ["#7c3aed", "#f97316", "#eab308", "#06b6d4", "#14b8a6"]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-[400px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
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
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Channel Performance</h3>
          <div className="grid grid-cols-1 gap-4">
            {data.map((channel, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">{channel.name}</div>
                      <div className="text-2xl font-bold">{channel.value}%</div>
                    </div>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">{getChannelDescription(channel.name)}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function getChannelDescription(channelName: string): string {
  const descriptions: Record<string, string> = {
    "Online Store": "Direct sales through your e-commerce website",
    Marketplace: "Sales through third-party platforms like Amazon, eBay",
    "Social Media": "Sales through social media platforms like Instagram, Facebook",
    Retail: "In-person sales at physical store locations",
    Other: "Sales through other channels like phone orders, email, etc.",
  }

  return descriptions[channelName] || "Sales through this channel"
}
