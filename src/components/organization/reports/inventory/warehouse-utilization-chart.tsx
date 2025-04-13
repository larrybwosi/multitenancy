"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface WarehouseUtilizationChartProps {
  warehouseData: any[]
}

export function WarehouseUtilizationChart({ warehouseData }: WarehouseUtilizationChartProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null)

  const filteredData = selectedWarehouse ? warehouseData.filter((w) => w.name === selectedWarehouse) : warehouseData

  return (
    <div className="space-y-6">
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={warehouseData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10,
            }}
            onClick={(data) => {
              if (data && data.activePayload && data.activePayload[0]) {
                const clickedWarehouse = data.activePayload[0].payload.name
                setSelectedWarehouse(selectedWarehouse === clickedWarehouse ? null : clickedWarehouse)
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}%`} />
            <Tooltip
              formatter={(value, name) => {
                if (name === "utilization") return [`${value}%`, "Utilization"]
                if (name === "capacity" || name === "used") return [`${value.toLocaleString()} units`, name]
                return [value, name]
              }}
              contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="capacity" name="Capacity" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="used" name="Used Space" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="utilization" name="Utilization %" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Warehouse Utilization Details</h3>
          <div className="space-y-4">
            {filteredData.map((warehouse, index) => (
              <Card key={index} className={selectedWarehouse === warehouse.name ? "border-indigo-500" : ""}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">{warehouse.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {warehouse.used.toLocaleString()} / {warehouse.capacity.toLocaleString()} units
                    </div>
                  </div>
                  <Progress value={warehouse.utilization} className="h-2 mb-2" />
                  <div className="flex justify-between text-sm">
                    <div
                      className={
                        warehouse.utilization > 85
                          ? "text-red-500"
                          : warehouse.utilization > 70
                            ? "text-amber-500"
                            : "text-green-500"
                      }
                    >
                      {warehouse.utilization}% utilized
                    </div>
                    <div className="text-muted-foreground">
                      {warehouse.availableSpace.toLocaleString()} units available
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Optimization Opportunities</h3>
          <div className="space-y-4">
            {warehouseData
              .sort((a, b) => b.utilization - a.utilization)
              .slice(0, 2)
              .map((warehouse, index) => (
                <Card key={index} className="bg-amber-50 border-amber-200">
                  <CardContent className="p-4">
                    <div className="font-medium text-amber-800">{warehouse.name} - High Utilization</div>
                    <div className="text-sm text-amber-700 mt-1">
                      This warehouse is at {warehouse.utilization}% capacity. Consider redistributing inventory to
                      optimize space.
                    </div>
                  </CardContent>
                </Card>
              ))}

            {warehouseData
              .sort((a, b) => a.utilization - b.utilization)
              .slice(0, 2)
              .map((warehouse, index) => (
                <Card key={index} className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="font-medium text-blue-800">{warehouse.name} - Low Utilization</div>
                    <div className="text-sm text-blue-700 mt-1">
                      This warehouse is only at {warehouse.utilization}% capacity. Consider consolidating inventory to
                      reduce costs.
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
