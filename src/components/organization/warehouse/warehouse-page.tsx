"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download, ShoppingBag } from "lucide-react"
import { WarehouseList } from "./warehouse-list"
import { WarehouseStats } from "./warehouse-stats"
import { WarehouseCreateSheet } from "./warehouse-create-sheet"
import { SectionHeader } from "@/components/ui/SectionHeader"

export function WarehousePage() {
  const [loading, setLoading] = useState(true)
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [showCreateSheet, setShowCreateSheet] = useState(false)

  const fetchWarehouses = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/organization/warehouse")
      const data = await response.json()
      setWarehouses(data.warehouses)
    } catch (error) {
      console.error("Error fetching warehouses:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const handleCreateSuccess = () => {
    fetchWarehouses()
  }

  return (
    <div className="space-y-6 container">
      <div className="flex justify-between items-center">
        <SectionHeader
          title="Warehouse Management"
          subtitle="Manage your organization's warehouses and storage facilities"
          icon={<ShoppingBag className="h-8 w-8 text-blue-800" />}
          autoUpdate="2 min"
        />

        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowCreateSheet(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
        </div>
      </div>

      <WarehouseStats warehouses={warehouses} loading={loading} />

      <Card>
        <CardHeader>
          <CardTitle>Warehouses</CardTitle>
          <CardDescription>
            View and manage all warehouses. Monitor capacity, inventory levels,
            and warehouse status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WarehouseList warehouses={warehouses} loading={loading} />
        </CardContent>
      </Card>

      <WarehouseCreateSheet
        open={showCreateSheet}
        onOpenChange={setShowCreateSheet}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
