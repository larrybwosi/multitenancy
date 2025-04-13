"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ShoppingCart } from "lucide-react"

interface LowStockItemsTableProps {
  lowStockItems: any[]
}

export function LowStockItemsTable({ lowStockItems }: LowStockItemsTableProps) {
  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead className="text-right">Reorder Point</TableHead>
              <TableHead className="text-right">Days Until Stockout</TableHead>
              <TableHead className="text-right">On Order</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lowStockItems.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    {item.currentStock <= 5 && <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />}
                    {item.name}
                  </div>
                </TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell>{item.warehouse}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={item.currentStock <= 5 ? "destructive" : "outline"}>{item.currentStock}</Badge>
                </TableCell>
                <TableCell className="text-right">{item.reorderPoint}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={item.daysUntilStockout <= 7 ? "destructive" : "outline"}>
                    {item.daysUntilStockout} days
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{item.onOrder || "None"}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="sr-only">Order</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center p-4 border rounded-md bg-amber-50 text-amber-800">
        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
        <div className="text-sm">
          <strong>Attention Required:</strong> {lowStockItems.length} products are below their reorder point and need to
          be restocked soon.
        </div>
      </div>
    </div>
  )
}
