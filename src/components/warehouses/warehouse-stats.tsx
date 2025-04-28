import { Box, Package, Truck } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface WarehouseStatsProps {
  id: string
}

export function WarehouseStats({ id }: WarehouseStatsProps) {
  // Mock data for warehouse stats
  const stats = {
    totalProducts: 3245,
    totalZones: 12,
    totalUnits: 156,
    incomingShipments: 8,
    outgoingShipments: 12,
    capacityUsed: 75,
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Across {stats.totalUnits} storage units</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Warehouse Capacity</CardTitle>
          <Box className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.capacityUsed}%</div>
          <div className="mt-1 h-2 w-full rounded-full bg-secondary">
            <div
              className={`h-full rounded-full ${
                stats.capacityUsed > 80 ? "bg-rose-500" : stats.capacityUsed > 60 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${stats.capacityUsed}%` }}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Incoming Shipments</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.incomingShipments}</div>
          <p className="text-xs text-muted-foreground">Expected in the next 7 days</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outgoing Shipments</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.outgoingShipments}</div>
          <p className="text-xs text-muted-foreground">Scheduled in the next 7 days</p>
        </CardContent>
      </Card>
    </div>
  )
}
