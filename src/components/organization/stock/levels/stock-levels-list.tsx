"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ChevronDown, ChevronUp, Eye, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"
import { StockLevelDetailsDialog } from "./stock-level-details-dialog"

export function StockLevelsList({ stockLevels, selectedWarehouse }) {
  const [expandedRows, setExpandedRows] = useState({})
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const toggleRow = (productId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }))
  }

  const handleViewDetails = (product) => {
    setSelectedProduct(product)
    setDetailsOpen(true)
  }

  const getStockStatusBadge = (quantity, minLevel, maxLevel) => {
    if (quantity <= minLevel) {
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1"
        >
          <AlertTriangle className="h-3 w-3" />
          <span>Low Stock</span>
        </Badge>
      )
    } else if (quantity >= maxLevel) {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 transition-colors flex items-center gap-1"
        >
          <AlertCircle className="h-3 w-3" />
          <span>Overstock</span>
        </Badge>
      )
    } else {
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors flex items-center gap-1"
        >
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
    <div>
      <div className="rounded-md border border-muted overflow-hidden transition-all hover:border-muted-foreground/20">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/70 transition-colors">
              <TableHead></TableHead>
              <TableHead className="font-medium">Product</TableHead>
              <TableHead className="font-medium">SKU</TableHead>
              <TableHead className="font-medium">Category</TableHead>
              <TableHead className="font-medium text-right">Quantity</TableHead>
              <TableHead className="font-medium text-right">Unit Cost</TableHead>
              <TableHead className="font-medium text-right">Total Value</TableHead>
              <TableHead className="font-medium text-right">Last Updated</TableHead>
              <TableHead className="font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockLevels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No stock items found
                </TableCell>
              </TableRow>
            ) : (
              stockLevels.map((item) => (
                <>
                  <TableRow key={item.productId} className="group hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleRow(item.productId)}
                        className="transition-colors hover:bg-muted focus:bg-muted"
                      >
                        {expandedRows[item.productId] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.image && (
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.productName}
                            className="h-8 w-8 rounded object-cover"
                          />
                        )}
                        <span>{item.productName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">{item.totalQuantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalValue)}</TableCell>
                    <TableCell className="text-right">{formatDate(item.lastUpdated)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(item)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRows[item.productId] && (
                    <TableRow>
                      <TableCell colSpan={9} className="p-0 border-t-0">
                        <div className="bg-muted/30 p-4 space-y-3 animate-in fade-in-50 slide-in-from-top-5">
                          <h4 className="font-medium mb-2">Warehouse Stock Levels</h4>
                          <div className="space-y-3">
                            {item.warehouses.map((warehouse) => (
                              <div key={warehouse.warehouseId} className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-3">
                                  <p className="text-sm font-medium">{warehouse.warehouseName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Location: {warehouse.location || "N/A"}
                                  </p>
                                </div>
                                <div className="col-span-5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{warehouse.minLevel}</span>
                                    <div className="flex-1 relative h-2">
                                      <div className="absolute inset-0 bg-muted rounded-full"></div>
                                      <div
                                        className={`absolute inset-y-0 left-0 rounded-full ${getProgressColor(warehouse.quantity, warehouse.minLevel, warehouse.maxLevel)}`}
                                        style={{
                                          width: `${Math.min(100, (warehouse.quantity / warehouse.maxLevel) * 100)}%`,
                                        }}
                                      ></div>
                                      <div
                                        className="absolute inset-y-0 w-0.5 bg-red-500"
                                        style={{ left: `${(warehouse.minLevel / warehouse.maxLevel) * 100}%` }}
                                      ></div>
                                      <div
                                        className="absolute inset-y-0 w-0.5 bg-blue-500"
                                        style={{ left: `${(warehouse.reorderPoint / warehouse.maxLevel) * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{warehouse.maxLevel}</span>
                                  </div>
                                </div>
                                <div className="col-span-2 text-right">
                                  <p className="text-sm font-medium">{warehouse.quantity} units</p>
                                  <p className="text-xs text-muted-foreground">
                                    Last count: {formatDate(warehouse.lastCountDate || item.lastUpdated)}
                                  </p>
                                </div>
                                <div className="col-span-2 text-right">
                                  {getStockStatusBadge(warehouse.quantity, warehouse.minLevel, warehouse.maxLevel)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedProduct && (
        <StockLevelDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} product={selectedProduct} />
      )}
    </div>
  )
}
