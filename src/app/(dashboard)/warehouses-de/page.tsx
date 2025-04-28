import { PlusCircle } from "lucide-react"
import Link from "next/link"

import { WarehouseList } from "@/components/warehouses/warehouse-list"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function WarehousesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-muted-foreground">Manage your warehouses and storage locations</p>
        </div>
        <Button asChild>
          <Link href="/warehouses/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Warehouse
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Warehouses</TabsTrigger>
            <TabsTrigger value="retail">Retail</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="all" className="mt-4">
          <WarehouseList />
        </TabsContent>
        <TabsContent value="retail" className="mt-4">
          <WarehouseList type="RETAIL_SHOP" />
        </TabsContent>
        <TabsContent value="distribution" className="mt-4">
          <WarehouseList type="WAREHOUSE" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
