"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AreaChart,
  Area,
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

interface InventoryReportChartProps {
  dateRange: string
}

export function InventoryReportChart({ dateRange }: InventoryReportChartProps) {
  const [loading, setLoading] = useState(true)
  const [inventoryData, setInventoryData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate mock data
      setInventoryData([
        { date: "Sep 1", electronics: 1200, furniture: 800, accessories: 1500, clothing: 950 },
        { date: "Sep 8", electronics: 1150, furniture: 850, accessories: 1400, clothing: 1000 },
        { date: "Sep 15", electronics: 1300, furniture: 750, accessories: 1450, clothing: 1050 },
        { date: "Sep 22", electronics: 1250, furniture: 900, accessories: 1350, clothing: 1100 },
        { date: "Sep 29", electronics: 1400, furniture: 950, accessories: 1300, clothing: 1150 },
        { date: "Oct 6", electronics: 1350, furniture: 1000, accessories: 1250, clothing: 1200 },
        { date: "Oct 13", electronics: 1450, furniture: 1050, accessories: 1200, clothing: 1250 },
        { date: "Oct 20", electronics: 1500, furniture: 1100, accessories: 1150, clothing: 1300 },
        { date: "Oct 27", electronics: 1550, furniture: 1150, accessories: 1100, clothing: 1350 },
        { date: "Nov 3", electronics: 1600, furniture: 1200, accessories: 1050, clothing: 1400 },
      ])

      setCategoryData([
        { name: "Electronics", value: 1600, color: "#7c3aed" },
        { name: "Furniture", value: 1200, color: "#f97316" },
        { name: "Accessories", value: 1050, color: "#eab308" },
        { name: "Clothing", value: 1400, color: "#06b6d4" },
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
          <AreaChart
            data={inventoryData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }} />
            <Legend />
            <defs>
              <linearGradient id="colorElectronics" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorFurniture" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorAccessories" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#eab308" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorClothing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="electronics"
              name="Electronics"
              stroke="#7c3aed"
              fill="url(#colorElectronics)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="furniture"
              name="Furniture"
              stroke="#f97316"
              fill="url(#colorFurniture)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="accessories"
              name="Accessories"
              stroke="#eab308"
              fill="url(#colorAccessories)"
              stackId="1"
            />
            <Area
              type="monotone"
              dataKey="clothing"
              name="Clothing"
              stroke="#06b6d4"
              fill="url(#colorClothing)"
              stackId="1"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Current Inventory by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} units`, "Quantity"]}
                  contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Inventory Insights</h3>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Total Inventory</div>
              <div className="text-2xl font-bold">5,250 units</div>
              <div className="text-sm text-green-600 mt-1">↑ 12% from last month</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Low Stock Items</div>
              <div className="text-2xl font-bold">24 products</div>
              <div className="text-sm text-amber-600 mt-1">Requires attention</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Inventory Turnover</div>
              <div className="text-2xl font-bold">4.7x</div>
              <div className="text-sm text-green-600 mt-1">↑ 0.3 from last quarter</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
