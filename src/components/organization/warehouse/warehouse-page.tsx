"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"
import { WarehouseList } from "./warehouse-list"
import { WarehouseStats } from "./warehouse-stats"
import { WarehouseCreateSheet } from "./warehouse-create-sheet"

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Warehouse Management</h1>
          <p className="text-muted-foreground">Manage your organization's warehouses and storage facilities</p>
        </div>
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
            View and manage all warehouses. Monitor capacity, inventory levels, and warehouse status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WarehouseList warehouses={warehouses} loading={loading} />
        </CardContent>
      </Card>

      <WarehouseCreateSheet open={showCreateSheet} onOpenChange={setShowCreateSheet} onSuccess={handleCreateSuccess} />
    </div>
  )
}
