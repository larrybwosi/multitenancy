import { InventoryList } from "@/components/inventory/inventory-list"
import { InventoryActions } from "@/components/inventory/inventory-actions"

export const metadata = {
  title: "Inventory - Stock Management System",
  description: "Manage your inventory across all warehouses",
}

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <InventoryActions />
      </div>
      <InventoryList />
    </div>
  )
}
