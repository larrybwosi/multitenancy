"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useMemo } from "react"
import type { InventoryData } from "@/types/reports"

interface LowStockItemsTableProps {
  data?: InventoryData["lowStock"]
}

export function LowStockItemsTable({ data }: LowStockItemsTableProps) {
  if (!data) return null

  const sortedData = useMemo(() => 
    [...data].sort((a, b) => 
      (a.currentStock / a.minimumStock) - (b.currentStock / b.minimumStock)
    ),
    [data]
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead className="text-right">Current Stock</TableHead>
          <TableHead className="text-right">Minimum Stock</TableHead>
          <TableHead className="text-right">Reorder Point</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
            <TableCell className="text-right">{item.currentStock}</TableCell>
            <TableCell className="text-right">{item.minimumStock}</TableCell>
            <TableCell className="text-right">{item.reorderPoint}</TableCell>
            <TableCell>
              <Badge
                variant={item.status === "warning" ? "warning" : "destructive"}
              >
                {item.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
