import { ArrowLeft, Edit, Truck } from "lucide-react"
import Link from "next/link"

import { InventoryDetails } from "@/components/inventory/inventory-details"
import { InventoryLocations } from "@/components/inventory/inventory-locations"
import { InventoryMovements } from "@/components/inventory/inventory-movements"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function InventoryDetailsPage({
  params,
}: {
  params: { id: string }
}) {
  // Mock data for product details
  const product = {
    id: "1",
    name: "Smartphone X1",
    sku: "SP-X1-001",
    category: "Electronics",
    stock: 342,
    reorderPoint: 50,
    status: "In Stock",
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground">
              <span className="inline-flex items-center gap-1">SKU: {product.sku}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/inventory/${params.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/transfers/new?product=${params.id}`}>
              <Truck className="mr-2 h-4 w-4" />
              Transfer Stock
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mt-4">
          <InventoryDetails id={params.id} />
        </TabsContent>
        <TabsContent value="locations" className="mt-4">
          <InventoryLocations id={params.id} />
        </TabsContent>
        <TabsContent value="movements" className="mt-4">
          <InventoryMovements id={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
