"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"

const categories = ["Appetizers", "Seafood platters", "Fish", "Shrimp", "Crab", "Squid", "Rice", "Drinks", "Dessert"]

export function ProductLists({ products, activeCategory, setActiveCategory, searchQuery, onAddToCart }) {
  const filteredProducts = searchQuery
    ? products.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products

  return (
    <div>
      <Tabs defaultValue={activeCategory} value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="mb-4 flex w-full overflow-x-auto">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="flex-shrink-0">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProductCard({ product, onAddToCart }) {
  const [quantity, setQuantity] = useState(0)
  const [variant, setVariant] = useState(product.variants?.[0] || "Original")

  const handleAddToCart = () => {
    if (quantity > 0) {
      onAddToCart(product, quantity, variant)
      setQuantity(0)
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="aspect-video w-full overflow-hidden rounded-t-lg">
          <img
            src={product.image || `/placeholder.svg?height=200&width=300`}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="font-medium">{product.name}</h3>
          <p className="text-sm font-medium text-muted-foreground mb-2">{formatCurrency(product.price)}</p>

          <div className="flex gap-2 mb-3">
            {product.variants?.map((v) => (
              <Button key={v} variant={variant === v ? "default" : "outline"} size="sm" onClick={() => setVariant(v)}>
                {v}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(Math.max(0, quantity - 1))}
                disabled={quantity === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" disabled={quantity === 0} onClick={handleAddToCart}>
              Add to cart
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
