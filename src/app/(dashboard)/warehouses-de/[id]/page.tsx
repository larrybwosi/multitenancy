"use client"

import { useState } from "react"
import { ArrowLeft, Building2, Edit, Plus } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { AddZoneModal } from "@/components/warehouses/add-zone-modal"
import { AddUnitModal } from "@/components/warehouses/add-unit-modal"
import { EditWarehouseSheet } from "@/components/warehouses/edit-warehouse-sheet"
import { RequestStockMovementModal } from "@/components/warehouses/request-stock-movement-modal"
import { WarehouseDetails } from "@/components/warehouses/warehouse-details"
import { WarehouseLayout } from "@/components/warehouses/warehouse-layout"
import { WarehouseStats } from "@/components/warehouses/warehouse-stats"
import { WarehouseZones } from "@/components/warehouses/warehouse-zones"
import { WarehouseInventory } from "@/components/warehouses/warehouse-inventory"
import { WarehouseMovements } from "@/components/warehouses/warehouse-movements"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "sonner"

export default function WarehouseDetailsPage() {
  const params = useParams()
  const id = params.id as string

  const [isAddZoneModalOpen, setIsAddZoneModalOpen] = useState(false)
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [isRequestMovementModalOpen, setIsRequestMovementModalOpen] = useState(false)

  // Mock data for warehouse name and location
  const warehouse = {
    name: "Main Warehouse",
    location: "New York",
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/warehouses">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{warehouse.name}</h1>
            <p className="text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {warehouse.location}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setIsRequestMovementModalOpen(true)}>
            Request Stock Movement
          </Button>
          <Button variant="outline" onClick={() => setIsEditSheetOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Warehouse
          </Button>
          <Button onClick={() => setIsAddZoneModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Zone
          </Button>
        </div>
      </div>

      <WarehouseStats id={id} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WarehouseLayout id={id} />
        </div>
        <div className="lg:col-span-1">
          <WarehouseDetails id={id} />
        </div>
      </div>

      <Tabs defaultValue="zones" className="animate-slide-in-up">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="zones">Zones & Units</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="sales">Sales Data</TabsTrigger>
        </TabsList>
        <TabsContent value="zones" className="mt-4">
          <WarehouseZones
            id={id}
            onAddZone={() => setIsAddZoneModalOpen(true)}
            onAddUnit={() => setIsAddUnitModalOpen(true)}
          />
        </TabsContent>
        <TabsContent value="inventory" className="mt-4">
          <WarehouseInventory id={id} />
        </TabsContent>
        <TabsContent value="movements" className="mt-4">
          <WarehouseMovements id={id} />
        </TabsContent>
        <TabsContent value="sales" className="mt-4">
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            Sales data will be displayed here
          </div>
        </TabsContent>
      </Tabs>

      <AddZoneModal warehouseId={id} open={isAddZoneModalOpen} onOpenChange={setIsAddZoneModalOpen} />

      <AddUnitModal warehouseId={id} open={isAddUnitModalOpen} onOpenChange={setIsAddUnitModalOpen} />

      <EditWarehouseSheet warehouseId={id} open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen} />

      <RequestStockMovementModal
        warehouseId={id}
        open={isRequestMovementModalOpen}
        onOpenChange={setIsRequestMovementModalOpen}
      />

      <Toaster position="top-right" />
    </div>
  )
}
