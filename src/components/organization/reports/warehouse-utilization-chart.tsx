"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

interface WarehouseUtilizationChartProps {
  dateRange: string
}

export function WarehouseUtilizationChart({ dateRange }: WarehouseUtilizationChartProps) {
  const [loading, setLoading] = useState(true)
  const [utilizationData, setUtilizationData] = useState<any[]>([])
  const [efficiencyData, setEfficiencyData] = useState<any[]>([])

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate mock data
      setUtilizationData([
        {
          name: "Main Warehouse",
          capacity: 10000,
          used: 7500,
          utilization: 75,
          inbound: 450,
          outbound: 520,
        },
        {
          name: "West Coast",
          capacity: 15000,
          used: 9800,
          utilization: 65,
          inbound: 620,
          outbound: 580,
        },
        {
          name: "Midwest",
          capacity: 8000,
          used: 7200,
          utilization: 90,
          inbound: 380,
          outbound: 410,
        },
        {
          name: "Southern",
          capacity: 12000,
          used: 6500,
          utilization: 54,
          inbound: 290,
          outbound: 340,
        },
        {
          name: "Northeast",
          capacity: 7500,
          used: 4200,
          utilization: 56,
          inbound: 210,
          outbound: 180,
        },
      ])

      setEfficiencyData([
        { subject: "Space Utilization", Main: 75, West: 65, Midwest: 90, Southern: 54, Northeast: 56 },
        { subject: "Order Fulfillment", Main: 82, West: 78, Midwest: 65, Southern: 88, Northeast: 70 },
        { subject: "Inventory Accuracy", Main: 95, West: 92, Midwest: 88, Southern: 90, Northeast: 94 },
        { subject: "Picking Efficiency", Main: 70, West: 75, Midwest: 60, Southern: 80, Northeast: 65 },
        { subject: "Shipping Time", Main: 85, West: 80, Midwest: 70, Southern: 75, Northeast: 90 },
      ])

      setLoading(false)
    }

    fetchData()
  }, [dateRange])

  if (loading) {
    return <Skeleton className="w-full h-[400px]" />
  }

  return (
    <div className="space-y-6">
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={utilizationData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10,
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
          <h3 className="text-lg font-medium mb-4">Warehouse Efficiency Metrics</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={efficiencyData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Main Warehouse" dataKey="Main" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.6} />
                <Radar name="West Coast" dataKey="West" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
                <Radar name="Midwest" dataKey="Midwest" stroke="#eab308" fill="#eab308" fillOpacity={0.6} />
                <Tooltip
                  formatter={(value) => [`${value}%`, ""]}
                  contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Warehouse Activity</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={utilizationData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} orders`, ""]}
                  contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
                <Legend />
                <Bar dataKey="inbound" name="Inbound Orders" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outbound" name="Outbound Orders" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
