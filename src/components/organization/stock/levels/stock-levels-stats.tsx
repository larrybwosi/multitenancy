"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Package, TrendingDown, TrendingUp, BarChart3 } from "lucide-react"

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

interface Props {
  stockLevels: StockLevel[]
}

export function StockLevelsStats({ stockLevels }: Props) {
  // Calculate total inventory value
  const totalValue = stockLevels.reduce((sum, item) => sum + item.totalValue, 0)

  // Calculate total number of products
  const totalProducts = stockLevels.length

  // Calculate low stock items - products with at least one location below min level
  const lowStockItems = stockLevels.filter(item => 
    item.variantStocks.some(vs => vs.quantity > 0 && vs.quantity <= vs.minLevel)
  ).length

  // Calculate out of stock items - products with zero quantity across all locations
  const outOfStockItems = stockLevels.filter(item => item.totalQuantity <= 0).length

  // Calculate overstock items - products with at least one location above max level
  const overstockItems = stockLevels.filter(item =>
    item.variantStocks.some(vs => vs.quantity >= vs.maxLevel)
  ).length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            Active products in inventory
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <TrendingDown className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockItems}</div>
          <p className="text-xs text-muted-foreground">
            {outOfStockItems} out of stock
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overstock</CardTitle>
          <TrendingUp className="h-4 w-4 text-info" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overstockItems}</div>
          <p className="text-xs text-muted-foreground">
            Products above max level
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          <p className="text-xs text-muted-foreground">
            Current inventory value
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
