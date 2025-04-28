"use client"

import { useState, useEffect } from "react"
import { Loader2, ExternalLink, Clock, Package2, Truck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface SupplierDetailsProps {
  supplierId: string
}

export function SupplierDetails({ supplierId }: SupplierDetailsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [supplier, setSupplier] = useState<any>(null)
  const [supplierProducts, setSupplierProducts] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])

  useEffect(() => {
    const fetchSupplierData = async () => {
      try {
        setIsLoading(true)

        // Fetch supplier details
        const supplierResponse = await fetch(`/api/suppliers/${supplierId}`)
        if (!supplierResponse.ok) throw new Error("Failed to fetch supplier")
        const supplierData = await supplierResponse.json()
        setSupplier(supplierData.data)

        // Fetch supplier products
        const productsResponse = await fetch(`/api/suppliers/${supplierId}/products`)
        if (!productsResponse.ok) throw new Error("Failed to fetch supplier products")
        const productsData = await productsResponse.json()
        setSupplierProducts(productsData.data.products || [])

        // Fetch purchase orders
        const ordersResponse = await fetch(`/api/purchase-orders?supplierId=${supplierId}`)
        if (!ordersResponse.ok) throw new Error("Failed to fetch purchase orders")
        const ordersData = await ordersResponse.json()
        setPurchaseOrders(ordersData.data.purchaseOrders || [])
      } catch (error) {
        console.error("Error fetching supplier data:", error)
        toast.error("Failed to load supplier data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSupplierData()
  }, [supplierId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Supplier not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="card-hover-effect animate-slide-in-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{supplier.name}</CardTitle>
              <CardDescription>Supplier ID: {supplier.id}</CardDescription>
            </div>
            <Badge variant={supplier.isActive ? "default" : "secondary"}>
              {supplier.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm">Contact Information</h3>
              <div className="text-sm text-muted-foreground mt-1">
                <p>{supplier.contactName || "No contact name provided"}</p>
                <p>{supplier.email || "No email provided"}</p>
                <p>{supplier.phone || "No phone provided"}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm">Address</h3>
              <p className="text-sm text-muted-foreground mt-1">{supplier.address || "No address provided"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-sm">Lead Time</h3>
              <div className="flex items-center mt-1">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {supplier.leadTimeDays ? `${supplier.leadTimeDays} days` : "Not specified"}
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-sm">Payment Terms</h3>
              <p className="text-sm text-muted-foreground mt-1">{supplier.paymentTerms || "Not specified"}</p>
            </div>

            <div>
              <h3 className="font-medium text-sm">Website</h3>
              {supplier.website ? (
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:underline mt-1"
                >
                  {supplier.website}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No website provided</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            <p>Created: {new Date(supplier.createdAt).toLocaleDateString()}</p>
            <p>Last Updated: {new Date(supplier.updatedAt).toLocaleDateString()}</p>
          </div>
        </CardFooter>
      </Card>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">
            <Package2 className="h-4 w-4 mr-2" />
            Products ({supplierProducts.length})
          </TabsTrigger>
          <TabsTrigger value="orders">
            <Truck className="h-4 w-4 mr-2" />
            Purchase Orders ({purchaseOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplied Products</CardTitle>
              <CardDescription>Products supplied by {supplier.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {supplierProducts.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No products found for this supplier.</p>
              ) : (
                <div className="space-y-4">
                  {supplierProducts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">SKU: {item.product.sku || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">Supplier SKU: {item.supplierSku || "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.costPrice.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          Min. Order: {item.minimumOrderQuantity || "N/A"}
                        </p>
                        {item.isPreferred && <Badge className="mt-1">Preferred</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <a href={`/inventory/restock?supplierId=${supplierId}`}>
                  <Truck className="mr-2 h-4 w-4" />
                  Create Purchase Order
                </a>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>Purchase orders from {supplier.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {purchaseOrders.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No purchase orders found for this supplier.</p>
              ) : (
                <div className="space-y-4">
                  {purchaseOrders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">
                            {order.reference || order.purchaseOrderNumber || `PO-${order.id.slice(-6)}`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Created: {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              order.status === "received"
                                ? "default"
                                : order.status === "ordered"
                                  ? "secondary"
                                  : order.status === "cancelled"
                                    ? "destructive"
                                    : "outline"
                            }
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          <p className="font-medium mt-1">${order.totalCost.toFixed(2)}</p>
                        </div>
                      </div>

                      <Separator className="my-2" />

                      <div className="text-sm">
                        <p>Items: {order._count?.items || 0}</p>
                        <p>
                          Delivery Date:{" "}
                          {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : "Not specified"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
