"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import { AlertTriangle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WarehouseList } from "./warehouses-list"

interface Warehouse {
  id: string
  name: string
  description?: string | null
  locationType: "WAREHOUSE" | "RETAIL_SHOP" | "DISTRIBUTION_CENTER"
  isActive: boolean
  isDefault: boolean
  capacityTracking: boolean
  totalCapacity?: number | null
  capacityUnit?: string | null
  capacityUsed?: number | null
  address?: string | null
  managerId?: string | null
  productCount: number
  stockValue: number
}

interface WarehouseTableProps {
  warehouses: Warehouse[]
  loading: boolean
  error?: Error | null
}

export function WarehouseTable({ warehouses, loading, error }: WarehouseTableProps) {
  const [searchQuery, setSearchQuery] = useState("")

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  const filteredWarehouses = warehouses?.filter((warehouse) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      warehouse.name.toLowerCase().includes(searchLower) ||
      (warehouse.address?.toLowerCase().includes(searchLower) || false)
    )
  })

  if (error) {
    return (
      <div className="border rounded-md p-4 flex flex-col items-center justify-center gap-4 h-64">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <div className="text-center">
          <h3 className="font-medium">Failed to load warehouses</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search warehouses..."
            className="pl-8"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Warehouses</TabsTrigger>
              <TabsTrigger value="retail">Retail</TabsTrigger>
              <TabsTrigger value="distribution">Distribution</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all" className="mt-4">
            <WarehouseList warehouses={filteredWarehouses} />
          </TabsContent>
          <TabsContent value="retail" className="mt-4">
            <WarehouseList 
              warehouses={filteredWarehouses.filter(w => w.locationType === "RETAIL_SHOP")} 
            />
          </TabsContent>
          <TabsContent value="distribution" className="mt-4">
            <WarehouseList 
              warehouses={filteredWarehouses.filter(w => w.locationType === "DISTRIBUTION_CENTER")} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
