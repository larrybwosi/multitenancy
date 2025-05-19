"use client"

import { useState } from "react"
import { Minus, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"

export function CartDetails({ cartItems, onUpdateItem, onRemoveItem, onClearCart, onCheckout }) {
  const [orderType, setOrderType] = useState("dine-in")
  const [customerName, setCustomerName] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [promoCode, setPromoCode] = useState("")

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = promoCode ? Math.round(subtotal * 0.1) : 0
  const tax = Math.round(subtotal * 0.025)
  const total = subtotal - discount + tax

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between py-4 px-6">
        <CardTitle className="text-xl">Cart Details</CardTitle>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gray-300"></span>
          <span className="h-2 w-2 rounded-full bg-gray-300"></span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto px-6">
        <Tabs defaultValue="dine-in" value={orderType} onValueChange={setOrderType}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="dine-in">Dine in</TabsTrigger>
            <TabsTrigger value="takeaway">Takeaway</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Customer information</h3>
            <div className="space-y-2">
              <div>
                <Label htmlFor="customer-name">Customer name</Label>
                <Input
                  id="customer-name"
                  placeholder="Enter name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="table-number">Table location</Label>
                <Select value={tableNumber} onValueChange={setTableNumber}>
                  <SelectTrigger id="table-number">
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Table 1</SelectItem>
                    <SelectItem value="2">Table 2</SelectItem>
                    <SelectItem value="3">Table 3</SelectItem>
                    <SelectItem value="4">Table 4</SelectItem>
                    <SelectItem value="5">Table 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Order items</h3>
              {cartItems.length > 0 && (
                <Button variant="link" size="sm" className="text-red-500 h-auto p-0" onClick={onClearCart}>
                  Clear all items
                </Button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">Your cart is empty</div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.variant}`} className="flex items-start gap-3">
                    <img
                      src={item.image || "/placeholder.svg?height=60&width=60"}
                      alt={item.name}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">Variant: {item.variant}</div>
                      <div className="text-sm font-medium">{formatCurrency(item.price)}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onUpdateItem(item.id, item.variant, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onUpdateItem(item.id, item.variant, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(item.price * item.quantity)}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 mt-1"
                        onClick={() => onRemoveItem(item.id, item.variant)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t">
            <div className="flex justify-between mb-1">
              <span>Sub total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Discount (10%)</span>
              <span>- {formatCurrency(discount)}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Tax (2.5%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-medium text-lg pt-2 border-t">
              <span>Total amount</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Enter promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
              <Button variant="outline">Apply</Button>
            </div>

            <Button className="w-full" size="lg" onClick={onCheckout} disabled={cartItems.length === 0}>
              Proceed payment
            </Button>
          </div>
        </div>
      </CardContent>
    </div>
  )
}
