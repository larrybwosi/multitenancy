"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ShoppingBag, Tag, Check, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface ProductStatsProps {
  products: any[]
  loading: boolean
}

export function ProductStats({ products, loading }: ProductStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calculate stats
  const totalProducts = products.length
  const totalVariants = products.reduce((sum, product) => sum + product.variants, 0)
  const activeProducts = products.filter((product) => product.status === "ACTIVE").length
  const inactiveProducts = products.filter((product) => product.status === "INACTIVE").length
  const averagePrice = products.reduce((sum, product) => sum + product.price, 0) / totalProducts

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <h3 className="text-2xl font-bold mt-1">{totalProducts}</h3>
              <p className="text-xs text-gray-500 mt-1">{totalVariants} total variants</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Average Price</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(averagePrice)}</h3>
              <p className="text-xs text-gray-500 mt-1">Across all products</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <Tag className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Active Products</p>
              <h3 className="text-2xl font-bold mt-1">{activeProducts}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {((activeProducts / totalProducts) * 100).toFixed(0)}% of total
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Check className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Inactive Products</p>
              <h3 className="text-2xl font-bold mt-1">{inactiveProducts}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {((inactiveProducts / totalProducts) * 100).toFixed(0)}% of total
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <X className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
