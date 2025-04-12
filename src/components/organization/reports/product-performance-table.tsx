"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils"
import { ArrowUp, ArrowDown } from "lucide-react"

interface ProductPerformanceTableProps {
  dateRange: string
}

export function ProductPerformanceTable({ dateRange }: ProductPerformanceTableProps) {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate mock data
      setProducts([
        {
          id: 1,
          name: "Premium Laptop",
          category: "Electronics",
          sales: 125,
          revenue: 162498.75,
          growth: 12.5,
          profit: 48749.63,
          margin: 30,
        },
        {
          id: 2,
          name: "Wireless Headphones",
          category: "Electronics",
          sales: 350,
          revenue: 69996.5,
          growth: 8.2,
          profit: 27998.6,
          margin: 40,
        },
        {
          id: 3,
          name: "Office Desk Chair",
          category: "Furniture",
          sales: 75,
          revenue: 18749.25,
          growth: -3.5,
          profit: 5624.78,
          margin: 30,
        },
        {
          id: 4,
          name: "Smartphone Case",
          category: "Accessories",
          sales: 420,
          revenue: 12595.8,
          growth: 15.8,
          profit: 6297.9,
          margin: 50,
        },
        {
          id: 5,
          name: "4K Monitor",
          category: "Electronics",
          sales: 95,
          revenue: 37999.05,
          growth: 22.3,
          profit: 15199.62,
          margin: 40,
        },
        {
          id: 6,
          name: "Ergonomic Keyboard",
          category: "Accessories",
          sales: 180,
          revenue: 16198.2,
          growth: 5.7,
          profit: 6479.28,
          margin: 40,
        },
        {
          id: 7,
          name: "Standing Desk",
          category: "Furniture",
          sales: 65,
          revenue: 32499.35,
          growth: 18.9,
          profit: 12999.74,
          margin: 40,
        },
        {
          id: 8,
          name: "Wireless Mouse",
          category: "Accessories",
          sales: 210,
          revenue: 10497.9,
          growth: -1.2,
          profit: 4199.16,
          margin: 40,
        },
        {
          id: 9,
          name: "Tablet",
          category: "Electronics",
          sales: 85,
          revenue: 42499.15,
          growth: 9.8,
          profit: 12749.75,
          margin: 30,
        },
        {
          id: 10,
          name: "Office Bookshelf",
          category: "Furniture",
          sales: 40,
          revenue: 11999.6,
          growth: -5.3,
          profit: 3599.88,
          margin: 30,
        },
      ])

      setLoading(false)
    }

    fetchData()
  }, [dateRange])

  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Sales</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Growth</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-right">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-6 w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[60px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[60px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[60px]" />
                    </TableCell>
                  </TableRow>
                ))
              : products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <CategoryBadge category={product.category} />
                    </TableCell>
                    <TableCell className="text-right">{product.sales}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end">
                        {product.growth > 0 ? (
                          <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                        )}
                        <span className={product.growth > 0 ? "text-green-500" : "text-red-500"}>
                          {Math.abs(product.growth)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(product.profit)}</TableCell>
                    <TableCell className="text-right">{product.margin}%</TableCell>
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
  }

  const colorClass = categoryColors[category] || "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"

  return (
    <Badge variant="outline" className={cn("font-medium", colorClass)}>
      {category}
    </Badge>
  )
}
