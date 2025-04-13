"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency } from "@/lib/utils"
import { ArrowUp, ArrowDown } from "lucide-react"

interface TopSellingProductsTableProps {
  products: any[]
}

export function TopSellingProductsTable({ products }: TopSellingProductsTableProps) {
  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Units Sold</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Growth</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <CategoryBadge category={product.category} />
                </TableCell>
                <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                <TableCell className="text-right">{product.sales}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end">
                    {Number.parseFloat(product.growth) > 0 ? (
                      <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                    )}
                    <span className={Number.parseFloat(product.growth) > 0 ? "text-green-500" : "text-red-500"}>
                      {Math.abs(Number.parseFloat(product.growth))}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const categoryColors: Record<string, string> = {
    Electronics: "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200",
    Furniture: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
    Accessories: "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200",
    Clothing: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200",
    "Office Supplies": "bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200",
  }

  const colorClass = categoryColors[category] || "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"

  return (
    <Badge variant="outline" className={cn("font-medium", colorClass)}>
      {category}
    </Badge>
  )
}
