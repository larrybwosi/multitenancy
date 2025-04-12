"use client"

import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Plus } from "lucide-react"
import Image from "next/image"

interface POSProductGridProps {
  products: any[]
  onAddToCart: (product: any) => void
}

export function POSProductGrid({ products, onAddToCart }: POSProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No products found. Try a different search term.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="border rounded-lg p-4 flex flex-col hover:border-indigo-200 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="relative h-12 w-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
              <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{product.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{product.sku}</p>
            </div>
          </div>

          <div className="mt-auto pt-2 flex items-center justify-between">
            <div>
              <p className="font-bold">{formatCurrency(product.price)}</p>
              <p className="text-xs text-muted-foreground">{product.stock} in stock</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onAddToCart(product)}
              disabled={product.stock <= 0}
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add to cart</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
