"use client"

import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Plus, Minus, Trash } from "lucide-react"

interface POSCartProps {
  items: any[]
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
}

export function POSCart({ items, onUpdateQuantity, onRemoveItem }: POSCartProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg">
        <p className="text-muted-foreground">No items in cart</p>
        <p className="text-xs text-muted-foreground mt-1">Add products to begin a sale</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
              <span className="sr-only">Decrease</span>
            </Button>

            <span className="w-8 text-center text-sm">{item.quantity}</span>

            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
              <span className="sr-only">Increase</span>
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveItem(item.id)}
            >
              <Trash className="h-3 w-3" />
              <span className="sr-only">Remove</span>
            </Button>
          </div>

          <div className="w-20 text-right">
            <p className="font-medium">{formatCurrency(item.total)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
