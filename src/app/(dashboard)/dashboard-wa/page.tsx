import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { InventoryOverview } from "@/components/dashboard/inventory-overview"
import { RecentMovements } from "@/components/dashboard/recent-movements"
import { WarehouseCapacity } from "@/components/dashboard/warehouse-capacity"
import { WarehouseOverview } from "@/components/dashboard/warehouse-overview"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader />
      <DashboardStats />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WarehouseOverview />
        <InventoryOverview />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WarehouseCapacity />
        <RecentMovements />
      </div>
    </div>
  )
}
