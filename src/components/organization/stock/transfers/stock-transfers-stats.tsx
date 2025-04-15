"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { Truck, Clock, ArrowRightLeft, CheckCircle, XCircle, DollarSign } from "lucide-react"

interface StockTransferItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

interface StockTransfer {
  id: string
  date: string
  sourceWarehouse: string
  sourceWarehouseId: string
  destinationWarehouse: string
  destinationWarehouseId: string
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  items: StockTransferItem[]
  totalValue: number
  totalQuantity: number
  notes?: string
}

interface StockTransfersStatsProps {
  transfers: StockTransfer[]
}

export function StockTransfersStats({ transfers }: StockTransfersStatsProps) {
  const stats = useMemo(() => {
    // Count transfers by status
    const pending = transfers.filter((t) => t.status === "pending").length
    const inTransit = transfers.filter((t) => t.status === "in_transit").length
    const completed = transfers.filter((t) => t.status === "completed").length
    const cancelled = transfers.filter((t) => t.status === "cancelled").length

    // Calculate total value of all transfers
    const totalValue = transfers.reduce((sum, t) => sum + (t.totalValue || 0), 0)

    // Calculate total quantity of all transfers
    const totalQuantity = transfers.reduce((sum, t) => sum + (t.totalQuantity || 0), 0)

    return {
      total: transfers.length,
      pending,
      inTransit,
      completed,
      cancelled,
      totalValue,
      totalQuantity,
    }
  }, [transfers])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-muted transition-all hover:border-muted-foreground/20 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">All stock transfers</p>
        </CardContent>
      </Card>

      <Card className="border-muted transition-all hover:border-muted-foreground/20 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending}</div>
          <p className="text-xs text-muted-foreground">Awaiting processing</p>
        </CardContent>
      </Card>

      <Card className="border-muted transition-all hover:border-muted-foreground/20 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          <ArrowRightLeft className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inTransit}</div>
          <p className="text-xs text-muted-foreground">Currently being shipped</p>
        </CardContent>
      </Card>

      <Card className="border-muted transition-all hover:border-muted-foreground/20 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completed}</div>
          <p className="text-xs text-muted-foreground">Successfully delivered</p>
        </CardContent>
      </Card>

      <Card className="border-muted transition-all hover:border-muted-foreground/20 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.cancelled}</div>
          <p className="text-xs text-muted-foreground">Transfers that were cancelled</p>
        </CardContent>
      </Card>

      <Card className="border-muted transition-all hover:border-muted-foreground/20 hover:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          <p className="text-xs text-muted-foreground">Value of all transfers</p>
        </CardContent>
      </Card>
    </div>
  )
}
