"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowDown, ArrowUp } from "lucide-react"

interface TopSellingProductsTableProps {
  products: Array<{
    name: string
    revenue: number
    units: number
    growth: number
  }>
}

export function TopSellingProductsTable({ products }: TopSellingProductsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Units Sold</TableHead>
          <TableHead className="text-right">Growth</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.name}>
            <TableCell>{product.name}</TableCell>
            <TableCell className="text-right">
              ${product.revenue.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              {product.units.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end space-x-1">
                {product.growth > 0 ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={
                    product.growth > 0 ? "text-green-500" : "text-red-500"
                  }
                >
                  {Math.abs(product.growth)}%
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
