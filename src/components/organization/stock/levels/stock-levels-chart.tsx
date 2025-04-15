"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/utils"
import { AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"

interface StockLevel {
  productId: string
  productName: string
  sku: string
  category: string
  imageUrls: string[]
  variantStocks: {
    warehouseId: string
    warehouseName: string
    quantity: number
    minLevel: number
    maxLevel: number
    reorderPoint: number
    reorderQuantity: number
    location: string
    lastCountDate: Date | null
  }[]
  totalQuantity: number
  unitCost: number
  totalValue: number
  lastUpdated: string
  status: string
}

interface ChartDataItem {
  name: string
  quantity: number
  minLevel: number
  maxLevel: number
  value: number
  status: string
}

interface Props {
  stockLevels: StockLevel[]
  selectedLocation: string
}

export function StockLevelsChart({ stockLevels, selectedLocation }: Props) {
  // Transform data for the chart
  const chartData = useMemo(() => {
    // If filtering by a specific location
    if (selectedLocation !== "all") {
      return stockLevels
        .map(item => {
          const locationStock = item.variantStocks.find(vs => vs.warehouseId === selectedLocation)
          if (!locationStock) return null

          return {
            name: item.productName,
            quantity: locationStock.quantity,
            minLevel: locationStock.minLevel,
            maxLevel: locationStock.maxLevel,
            value: item.unitCost * locationStock.quantity,
            status: item.status,
          }
        })
        .filter((item): item is ChartDataItem => item !== null)
    }

    // Otherwise show total quantities across all locations
    return stockLevels.map(item => {
      // Calculate min/max levels as averages across locations
      const avgMinLevel = item.variantStocks.reduce((sum, vs) => sum + vs.minLevel, 0) / item.variantStocks.length
      const avgMaxLevel = item.variantStocks.reduce((sum, vs) => sum + vs.maxLevel, 0) / item.variantStocks.length

      return {
        name: item.productName,
        quantity: item.totalQuantity,
        minLevel: avgMinLevel,
        maxLevel: avgMaxLevel,
        value: item.totalValue,
        status: item.status,
      }
    })
  }, [stockLevels, selectedLocation])

  // Sort data by quantity
  const sortedChartData = useMemo(() => {
    return [...chartData].sort((a, b) => b.quantity - a.quantity)
  }, [chartData])

  const getBarColor = (entry: ChartDataItem | undefined) => {
    if (!entry) return "#22c55e"
    switch (entry.status) {
      case "out_of_stock":
        return "#ef4444" // red-500
      case "low_stock":
        return "#f59e0b" // amber-500
      case "overstock":
        return "#3b82f6" // blue-500
      default:
        return "#22c55e" // green-500
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-sm">Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="text-sm">Out of Stock</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-warning" />
          <span className="text-sm">Low Stock</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-info" />
          <span className="text-sm">Overstock</span>
        </div>
      </div>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedChartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              className="text-xs"
            />
            <YAxis 
              yAxisId="left"
              className="text-xs"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => formatCurrency(value)}
              className="text-xs"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as ChartDataItem
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="font-medium">{label}</div>
                      <div className="text-sm text-muted-foreground">
                        Quantity: {data.quantity}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Value: {formatCurrency(data.value)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Min Level: {Math.round(data.minLevel)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Max Level: {Math.round(data.maxLevel)}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend />
            <Bar
              dataKey="quantity"
              name="Quantity"
              yAxisId="left"
              fill={getBarColor}
            />
            <Bar
              dataKey="value"
              name="Value"
              yAxisId="right"
              fill="#6b7280"
              fillOpacity={0.3}
            />
            <Bar
              dataKey="minLevel"
              name="Min Level"
              yAxisId="left"
              fill="#ef4444"
              fillOpacity={0.2}
            />
            <Bar
              dataKey="maxLevel"
              name="Max Level"
              yAxisId="left"
              fill="#3b82f6"
              fillOpacity={0.2}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
