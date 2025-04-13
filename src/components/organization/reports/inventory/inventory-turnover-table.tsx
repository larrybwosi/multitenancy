"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"

interface InventoryTurnoverTableProps {
  turnoverData: any[]
}

export function InventoryTurnoverTable({ turnoverData }: InventoryTurnoverTableProps) {
  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Turnover Rate</TableHead>
              <TableHead className="text-right">Days on Hand</TableHead>
              <TableHead className="text-right">Cost of Goods Sold</TableHead>
              <TableHead className="text-right">Average Inventory</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {turnoverData.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">{item.turnover}x</TableCell>
                <TableCell className="text-right">{item.daysOnHand} days</TableCell>
                <TableCell className="text-right">{formatCurrency(item.costOfGoodsSold)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.averageInventory)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 border rounded-md bg-muted/50">
        <h3 className="text-sm font-medium mb-2">About Inventory Turnover</h3>
        <p className="text-sm text-muted-foreground">
          Inventory turnover measures how many times your inventory is sold and replaced over a period. A higher
          turnover indicates efficient inventory management, while a lower turnover may suggest overstocking or
          obsolescence. Days on Hand shows how long inventory stays in stock before being sold.
        </p>
      </div>
    </div>
  )
}
