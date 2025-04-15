"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface StockLevel {
  productId: string
  productName: string
  sku: string
  category: string
  imageUrls: string[]
  variantStocks: {
    warehouseId: string
    warehouseName: string
    quantity: number
    minLevel: number
    maxLevel: number
    reorderPoint: number
    reorderQuantity: number
    location: string
    lastCountDate: Date | null
  }[]
  totalQuantity: number
  unitCost: number
  totalValue: number
  lastUpdated: string
  status: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: StockLevel | null
}

export function StockLevelDetailsDialog({ open, onOpenChange, product }: Props) {
  if (!product) return null

  const getStockStatusBadge = (quantity: number, minLevel: number, maxLevel: number) => {
    if (quantity <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    if (quantity <= minLevel) {
      return <Badge variant="warning">Low Stock</Badge>
    }
    if (quantity >= maxLevel) {
      return <Badge variant="info">Overstock</Badge>
    }
    return <Badge variant="outline">Normal</Badge>
  }

  const getProgressColor = (quantity: number, minLevel: number, maxLevel: number) => {
    if (quantity <= 0) return "bg-destructive"
    if (quantity <= minLevel) return "bg-warning"
    if (quantity >= maxLevel) return "bg-info"
    return "bg-success"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product.productName}</DialogTitle>
          <DialogDescription>
            SKU: {product.sku} | Category: {product.category}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="stock" className="w-full">
          <TabsList>
            <TabsTrigger value="stock">Stock Levels</TabsTrigger>
            <TabsTrigger value="info">Product Info</TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Min Level</TableHead>
                  <TableHead className="text-right">Reorder Point</TableHead>
                  <TableHead className="text-right">Max Level</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.variantStocks.map((vs) => (
                  <TableRow key={vs.warehouseId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vs.warehouseName}</div>
                        {vs.location && (
                          <div className="text-xs text-muted-foreground">{vs.location}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{vs.quantity}</TableCell>
                    <TableCell className="text-right">{vs.minLevel}</TableCell>
                    <TableCell className="text-right">{vs.reorderPoint}</TableCell>
                    <TableCell className="text-right">{vs.maxLevel}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(vs.quantity, vs.minLevel, vs.maxLevel)}`}
                            style={{ width: `${Math.min(100, (vs.quantity / vs.maxLevel) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">
                          {Math.round((vs.quantity / vs.maxLevel) * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStockStatusBadge(vs.quantity, vs.minLevel, vs.maxLevel)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{product.totalQuantity}</TableCell>
                  <TableCell colSpan={5}></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="info">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Product Details</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Name</dt>
                      <dd className="text-sm">{product.productName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">SKU</dt>
                      <dd className="text-sm">{product.sku}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Category</dt>
                      <dd className="text-sm">{product.category}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Last Updated</dt>
                      <dd className="text-sm">{formatDate(new Date(product.lastUpdated))}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Stock Summary</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Total Quantity</dt>
                      <dd className="text-sm">{product.totalQuantity}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Unit Cost</dt>
                      <dd className="text-sm">{formatCurrency(product.unitCost)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Total Value</dt>
                      <dd className="text-sm">{formatCurrency(product.totalValue)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Status</dt>
                      <dd className="text-sm">
                        {getStockStatusBadge(
                          product.totalQuantity,
                          Math.min(...product.variantStocks.map(vs => vs.minLevel)),
                          Math.max(...product.variantStocks.map(vs => vs.maxLevel))
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {product.imageUrls?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Product Images</h4>
                  <div className="grid grid-cols-4 gap-4">
                    {product.imageUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`${product.productName} - ${index + 1}`}
                        className="aspect-square rounded-md object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
