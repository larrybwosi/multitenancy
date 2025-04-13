"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Package, TrendingDown, TrendingUp, BarChart3 } from "lucide-react"

export function StockLevelsStats({ stockLevels }) {
  // Calculate total inventory value
  const totalValue = stockLevels.reduce((sum, item) => sum + item.totalValue, 0)

  // Calculate total number of products
  const totalProducts = stockLevels.length

  // Calculate low stock items
  const lowStockItems = stockLevels.filter((item) => item.warehouses.some((wh) => wh.quantity <= wh.minLevel)).length

  // Calculate overstock items
  const overstockItems = stockLevels.filter((item) => item.warehouses.some((wh) => wh.quantity >= wh.maxLevel)).length

  // Calculate items that need reordering
  const reorderItems = stockLevels.filter((item) =>
    item.warehouses.some((wh) => wh.quantity <= (wh.reorderPoint || wh.minLevel)),
  ).length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-muted transition-all hover:border-muted-foreground/20 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          <p className="text-xs text-muted-foreground">Across {totalProducts} products</p>
        </CardContent>
      </Card>

      <Card className="border-muted transition-all hover:border-muted-foreground/20 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockItems}</div>
          <p className="text-xs text-muted-foreground">Items below minimum stock level</p>
        </CardContent>
      </Card>

      <Card className="border-muted transition-all hover:border-muted-foreground/20 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overstock Items</CardTitle>
          <TrendingUp className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overstockItems}</div>
          <p className="text-xs text-muted-foreground">Items above maximum stock level</p>
        </CardContent>
      </Card>

      <Card className="border-muted transition-all hover:border-muted-foreground/20 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Items to Reorder</CardTitle>
          <BarChart3 className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reorderItems}</div>
          <p className="text-xs text-muted-foreground">Items at or below reorder point</p>
        </CardContent>
      </Card>
    </div>
  )
}
