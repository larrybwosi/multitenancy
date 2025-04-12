"use client"

import { Card } from "@/components/ui/card"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface StaffApplicationsCardProps {
  data: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
}

export function StaffApplicationsCard({ data }: StaffApplicationsCardProps) {
  const chartData = [
    { name: "Pending", value: data.pending, color: "#8b5cf6" },
    { name: "Approved", value: data.approved, color: "#f97316" },
    { name: "Rejected", value: data.rejected, color: "#eab308" },
  ]

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Staff applications card</h3>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-full h-[200px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [`${value}`, "Count"]}
                contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
              />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                <tspan x="50%" dy="-5" fontSize="24" fontWeight="bold">
                  {data.total}
                </tspan>
                <tspan x="50%" dy="20" fontSize="12" fill="#666">
                  Total
                </tspan>
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 w-full mt-4 gap-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
            <div>
              <p className="font-semibold">{data.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
            <div>
              <p className="font-semibold">{data.approved}</p>
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <div>
              <p className="font-semibold">{data.rejected}</p>
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
