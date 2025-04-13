"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"

export function StockLevelsChart({ stockLevels, selectedWarehouse }) {
  // Transform data for the chart
  const chartData = useMemo(() => {
    // If we're filtering by a specific warehouse, we need to adjust the data
    if (selectedWarehouse !== "all") {
      return stockLevels
        .map((item) => {
          const warehouse = item.warehouses.find((wh) => wh.warehouseId === selectedWarehouse)
          if (!warehouse) return null

          return {
            name: item.productName,
            quantity: warehouse.quantity,
            minLevel: warehouse.minLevel,
            maxLevel: warehouse.maxLevel,
            value: item.unitCost * warehouse.quantity,
            status:
              warehouse.quantity <= warehouse.minLevel
                ? "low"
                : warehouse.quantity >= warehouse.maxLevel
                  ? "high"
                  : "normal",
          }
        })
        .filter(Boolean)
    }

    // Otherwise, use total quantities
    return stockLevels.map((item) => {
      // Calculate average min and max levels across warehouses
      const avgMinLevel = item.warehouses.reduce((sum, wh) => sum + wh.minLevel, 0) / item.warehouses.length
      const avgMaxLevel = item.warehouses.reduce((sum, wh) => sum + wh.maxLevel, 0) / item.warehouses.length

      // Determine status based on total quantity compared to average levels
      let status = "normal"
      if (item.totalQuantity <= avgMinLevel) status = "low"
      else if (item.totalQuantity >= avgMaxLevel) status = "high"

      return {
        name: item.productName,
        quantity: item.totalQuantity,
        minLevel: avgMinLevel,
        maxLevel: avgMaxLevel,
        value: item.totalValue,
        status,
      }
    })
  }, [stockLevels, selectedWarehouse])

  // Sort data by quantity
  const sortedChartData = useMemo(() => {
    return [...chartData].sort((a, b) => b.quantity - a.quantity)
  }, [chartData])

  // Limit to top 10 products for better visualization
  const limitedChartData = useMemo(() => {
    return sortedChartData.slice(0, 10)
  }, [sortedChartData])

  // Get custom bar colors based on status
  const getBarColor = (entry) => {
    switch (entry.status) {
      case "low":
        return "#ef4444" // red-500
      case "high":
        return "#eab308" // yellow-500
      default:
        return "#22c55e" // green-500
    }
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <Card className="p-2 shadow-lg border-muted bg-white">
          <CardContent className="p-2 space-y-1">
            <p className="font-medium">{data.name}</p>
            <p className="text-sm flex items-center gap-1">
              <span>Quantity:</span>
              <span className="font-medium">{data.quantity}</span>
            </p>
            <p className="text-sm flex items-center gap-1">
              <span>Value:</span>
              <span className="font-medium">{formatCurrency(data.value)}</span>
            </p>
            <p className="text-sm flex items-center gap-1">
              <span>Status:</span>
              <span className="flex items-center gap-1">
                {data.status === "low" ? (
                  <>
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span className="text-red-500">Low Stock</span>
                  </>
                ) : data.status === "high" ? (
                  <>
                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                    <span className="text-yellow-500">Overstock</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">Normal</span>
                  </>
                )}
              </span>
            </p>
          </CardContent>
        </Card>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={limitedChartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 70,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="quantity"
              name="Quantity"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              barSize={30}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {limitedChartData.map((entry, index) => (
                <Bar key={`bar-${index}`} fill={getBarColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={limitedChartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 70,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} interval={0} tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(value) => `$${value}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="value"
              name="Value"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              barSize={30}
              isAnimationActive={true}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
