"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Warehouse, Package, AlertTriangle, CheckCircle } from "lucide-react"

interface WarehouseStatsProps {
  warehouses: any[]
  loading: boolean
}

export function WarehouseStats({ warehouses, loading }: WarehouseStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calculate stats
  const totalWarehouses = warehouses.length
  const totalCapacity = warehouses.reduce((sum, wh) => sum + wh.capacity, 0)
  const totalUsed = warehouses.reduce((sum, wh) => sum + wh.used, 0)
  const utilizationRate = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0
  const maintenanceCount = warehouses.filter((wh) => wh.status === "MAINTENANCE").length
  const activeCount = warehouses.filter((wh) => wh.status === "ACTIVE").length
  const totalProducts = warehouses.reduce((sum, wh) => sum + wh.productCount, 0)

  // Check if any warehouse is near capacity (>90%)
  const nearCapacityCount = warehouses.filter((wh) => wh.used / wh.capacity > 0.9).length

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Warehouses</p>
              <h3 className="text-2xl font-bold mt-1">{totalWarehouses}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {activeCount} active, {maintenanceCount} in maintenance
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Warehouse className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Storage Utilization</p>
              <h3 className="text-2xl font-bold mt-1">{utilizationRate}%</h3>
              <p className="text-xs text-gray-500 mt-1">
                {totalUsed.toLocaleString()} / {totalCapacity.toLocaleString()} units
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Package className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Near Capacity</p>
              <h3 className="text-2xl font-bold mt-1">{nearCapacityCount}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {nearCapacityCount > 0 ? "Warehouses need attention" : "All warehouses have space"}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <h3 className="text-2xl font-bold mt-1">{totalProducts.toLocaleString()}</h3>
              <p className="text-xs text-gray-500 mt-1">Across all warehouses</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
