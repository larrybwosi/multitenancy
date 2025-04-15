"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useMemo } from "react"
import type { InventoryData } from "@/types/reports"

interface InventoryTurnoverTableProps {
  data?: InventoryData["turnover"]
}

export function InventoryTurnoverTable({ data }: InventoryTurnoverTableProps) {
  if (!data) return null

  const sortedData = useMemo(() => 
    [...data].sort((a, b) => b.turnoverRate - a.turnoverRate),
    [data]
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Value</TableHead>
          <TableHead className="text-right">Turnover Rate</TableHead>
          <TableHead className="text-right">Average Days</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((item) => (
          <TableRow key={item.category}>
            <TableCell className="font-medium">{item.category}</TableCell>
            <TableCell className="text-right">
              ${item.value.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              {item.turnoverRate.toFixed(2)}x
            </TableCell>
            <TableCell className="text-right">
              {item.averageDays} days
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
