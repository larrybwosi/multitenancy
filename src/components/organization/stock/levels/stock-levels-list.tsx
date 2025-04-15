"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ChevronDown, ChevronUp, Eye, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"
import { StockLevelDetailsDialog } from "./stock-level-details-dialog"

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
  stockLevels: StockLevel[]
  selectedLocation: string
}

export function StockLevelsList({ stockLevels, selectedLocation }: Props) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [selectedProduct, setSelectedProduct] = useState<StockLevel | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const toggleRow = (productId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }))
  }

  const handleViewDetails = (product: StockLevel) => {
    setSelectedProduct(product)
    setDetailsOpen(true)
  }

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

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case "out_of_stock":
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case "low_stock":
        return <AlertCircle className="h-4 w-4 text-warning" />
      case "overstock":
        return <AlertCircle className="h-4 w-4 text-info" />
      default:
        return <CheckCircle className="h-4 w-4 text-success" />
    }
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Total Quantity</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Last Updated</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockLevels.map((level) => (
              <>
                <TableRow key={level.productId}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleRow(level.productId)}
                    >
                      {expandedRows[level.productId] ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {level.imageUrls?.[0] && (
                        <img
                          src={level.imageUrls[0]}
                          alt={level.productName}
                          className="h-8 w-8 rounded-md object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{level.productName}</div>
                        <div className="text-xs text-muted-foreground">{level.sku}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{level.category}</TableCell>
                  <TableCell className="text-right">{level.totalQuantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(level.totalValue)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStockStatusIcon(level.status)}
                      {getStockStatusBadge(
                        level.totalQuantity,
                        Math.min(...level.variantStocks.map(vs => vs.minLevel)),
                        Math.max(...level.variantStocks.map(vs => vs.maxLevel))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDate(new Date(level.lastUpdated))}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleViewDetails(level)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedRows[level.productId] && (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <div className="bg-muted/50 p-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Location</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead className="text-right">Min Level</TableHead>
                              <TableHead className="text-right">Max Level</TableHead>
                              <TableHead>Stock Level</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {level.variantStocks
                              .filter(vs => selectedLocation === "all" || vs.warehouseId === selectedLocation)
                              .map((vs) => (
                                <TableRow key={`${level.productId}-${vs.warehouseId}`}>
                                  <TableCell>{vs.warehouseName}</TableCell>
                                  <TableCell className="text-right">{vs.quantity}</TableCell>
                                  <TableCell className="text-right">{vs.minLevel}</TableCell>
                                  <TableCell className="text-right">{vs.maxLevel}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className={`h-full ${getProgressColor(vs.quantity, vs.minLevel, vs.maxLevel)}`}
                                          style={{ width: `${Math.min(100, (vs.quantity / vs.maxLevel) * 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs">{Math.round((vs.quantity / vs.maxLevel) * 100)}%</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>{getStockStatusBadge(vs.quantity, vs.minLevel, vs.maxLevel)}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      <StockLevelDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        product={selectedProduct}
      />
    </>
  )
}
