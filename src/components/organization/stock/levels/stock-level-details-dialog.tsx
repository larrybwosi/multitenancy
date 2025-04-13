"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Package,
  Truck,
  CalendarClock,
  Tag,
  Info,
  FileText,
} from "lucide-react"

export function StockLevelDetailsDialog({ open, onOpenChange, product }) {
  const getStockStatusBadge = (quantity, minLevel, maxLevel) => {
    if (quantity <= minLevel) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Low Stock</span>
        </Badge>
      )
    } else if (quantity >= maxLevel) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          <span>Overstock</span>
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span>Normal</span>
        </Badge>
      )
    }
  }

  const getProgressColor = (quantity, minLevel, maxLevel) => {
    if (quantity <= minLevel) {
      return "bg-red-500"
    } else if (quantity >= maxLevel) {
      return "bg-yellow-500"
    } else {
      return "bg-green-500"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex items-center gap-2">
              {product.image && (
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.productName}
                  className="h-8 w-8 rounded object-cover"
                />
              )}
              {product.productName}
            </div>
          </DialogTitle>
          <DialogDescription>
            SKU: <span className="font-mono">{product.sku}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="overview"
              className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="warehouses"
              className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Warehouse Details
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Product Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Stock Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-medium">Total Quantity</p>
                      <p className="text-xl font-bold">{product.totalQuantity} units</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Value</p>
                      <p className="text-xl font-bold">{formatCurrency(product.totalValue)}</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Supplier Information
                  </h3>
                  <p className="font-medium">{product.supplier || "Not specified"}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-medium">Lead Time</p>
                      <p>
                        {product.leadTime || "N/A"} {product.leadTime ? "days" : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <p className="capitalize">{product.status?.replace("_", " ") || "Normal"}</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <CalendarClock className="h-4 w-4" />
                    Dates
                  </h3>
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p>{formatDate(product.lastUpdated)}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    Product Details
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-medium">Category</p>
                      <p>{product.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Unit Cost</p>
                      <p>{formatCurrency(product.unitCost)}</p>
                    </div>
                    {product.dimensions && (
                      <div>
                        <p className="text-sm font-medium">Dimensions</p>
                        <p>{product.dimensions}</p>
                      </div>
                    )}
                    {product.weight && (
                      <div>
                        <p className="text-sm font-medium">Weight</p>
                        <p>{product.weight}</p>
                      </div>
                    )}
                  </div>
                </div>

                {product.tags && product.tags.length > 0 && (
                  <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {product.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="capitalize">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {product.notes && (
                  <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Notes
                    </h3>
                    <p className="text-sm">{product.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="warehouses" className="mt-4">
            <div className="border rounded-lg overflow-hidden transition-all hover:border-muted-foreground/20 hover:shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/70 transition-colors">
                    <TableHead className="font-medium">Warehouse</TableHead>
                    <TableHead className="font-medium">Location</TableHead>
                    <TableHead className="font-medium text-right">Quantity</TableHead>
                    <TableHead className="font-medium text-right">Min Level</TableHead>
                    <TableHead className="font-medium text-right">Reorder Point</TableHead>
                    <TableHead className="font-medium text-right">Max Level</TableHead>
                    <TableHead className="font-medium">Stock Level</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.warehouses.map((warehouse) => (
                    <TableRow key={warehouse.warehouseId} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{warehouse.warehouseName}</TableCell>
                      <TableCell>{warehouse.location || "N/A"}</TableCell>
                      <TableCell className="text-right">{warehouse.quantity}</TableCell>
                      <TableCell className="text-right">{warehouse.minLevel}</TableCell>
                      <TableCell className="text-right">{warehouse.reorderPoint || "N/A"}</TableCell>
                      <TableCell className="text-right">{warehouse.maxLevel}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getProgressColor(warehouse.quantity, warehouse.minLevel, warehouse.maxLevel)}`}
                              style={{ width: `${Math.min(100, (warehouse.quantity / warehouse.maxLevel) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs">
                            {Math.round((warehouse.quantity / warehouse.maxLevel) * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStockStatusBadge(warehouse.quantity, warehouse.minLevel, warehouse.maxLevel)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <div className="border rounded-lg p-4 space-y-4 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Product Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Product Name</p>
                      <p>{product.productName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">SKU</p>
                      <p className="font-mono">{product.sku}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Category</p>
                      <p>{product.category}</p>
                    </div>
                    {product.dimensions && (
                      <div>
                        <p className="text-sm font-medium">Dimensions</p>
                        <p>{product.dimensions}</p>
                      </div>
                    )}
                    {product.weight && (
                      <div>
                        <p className="text-sm font-medium">Weight</p>
                        <p>{product.weight}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Inventory Settings</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Unit Cost</p>
                      <p>{formatCurrency(product.unitCost)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Supplier</p>
                      <p>{product.supplier || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Lead Time</p>
                      <p>
                        {product.leadTime || "N/A"} {product.leadTime ? "days" : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p>{formatDate(product.lastUpdated)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {product.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Notes</h3>
                  <p className="text-sm">{product.notes}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
