"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Progress } from "@/components/ui/progress"
import type { InventoryData } from "@/types/reports"

interface WarehouseUtilizationChartProps {
  data?: InventoryData["warehouse"]
}

export function WarehouseUtilizationChart({ data }: WarehouseUtilizationChartProps) {
  if (!data) return null

  return (
    <div className="space-y-8">
      {/* Utilization bars */}
      <div className="grid gap-6">
        {data.map((zone) => (
          <div key={zone.zone} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex flex-col">
                <span className="font-medium">{zone.zone}</span>
                <span className="text-muted-foreground">
                  {zone.items.toLocaleString()} items
                </span>
              </div>
              <span className="font-medium">
                {((zone.utilization / zone.capacity) * 100).toFixed(1)}%
              </span>
            </div>
            <Progress
              value={(zone.utilization / zone.capacity) * 100}
              className="h-2"
              indicatorClassName={
                (zone.utilization / zone.capacity) * 100 > 90
                  ? "bg-red-500"
                  : (zone.utilization / zone.capacity) * 100 > 75
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }
            />
          </div>
        ))}
      </div>

      {/* Capacity distribution chart */}
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            barSize={40}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="zone"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                const data = payload[0].payload
                const utilizationPercentage = (data.utilization / data.capacity) * 100
                const color =
                  utilizationPercentage > 90
                    ? "text-red-500"
                    : utilizationPercentage > 75
                    ? "text-yellow-500"
                    : "text-green-500"

                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {data.zone}
                        </span>
                        <span className={`font-bold ${color}`}>
                          {utilizationPercentage.toFixed(1)}% utilized
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {data.utilization.toLocaleString()} /{" "}
                          {data.capacity.toLocaleString()} units
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {data.items.toLocaleString()} items
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="utilization"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
