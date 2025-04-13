"use client"

import { Card, CardContent } from "@/components/ui/card"
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
import { formatCurrency } from "@/lib/utils"

interface InventoryOverviewChartProps {
  inventoryData: any[]
  categoryData: any[]
  summary: {
    totalInventory: number
    lowStockItems: number
    inventoryValue: number
    inventoryTurnover: string
  }
}

export function InventoryOverviewChart({ inventoryData, categoryData, summary }: InventoryOverviewChartProps) {
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
              <linearGradient id="colorOfficeSupplies" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.1} />
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
            <Area
              type="monotone"
              dataKey="officesupplies"
              name="Office Supplies"
              stroke="#14b8a6"
              fill="url(#colorOfficeSupplies)"
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
                  labelLine={false}
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
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Total Inventory</div>
                <div className="text-2xl font-bold">{summary.totalInventory?.toLocaleString() || 0} units</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Inventory Value</div>
                <div className="text-2xl font-bold">{formatCurrency(summary.inventoryValue || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Low Stock Items</div>
                <div className="text-2xl font-bold">{summary.lowStockItems || 0} products</div>
                <div className="text-sm text-amber-600 mt-1">Requires attention</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm font-medium text-muted-foreground">Inventory Turnover</div>
                <div className="text-2xl font-bold">{summary.inventoryTurnover || 0}x</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
