"use client"

import { useState } from "react"
import { Minus, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export function CartComponent({ onClose, onCheckout }) {
  const [customer, setCustomer] = useState("")
  const [items, setItems] = useState([
    {
      id: 1,
      name: "Performance Review Software - Monthly",
      price: 49.99,
      quantity: 1,
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      id: 2,
      name: "Employee Training Module",
      price: 199.99,
      quantity: 1,
      image: "/placeholder.svg?height=60&width=60",
    },
  ])
  const [promoCode, setPromoCode] = useState("")

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return
    setItems(items.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = promoCode === "EMPLOYEE20" ? subtotal * 0.2 : 0
  const tax = subtotal * 0.1
  const total = subtotal - discount + tax

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Cart</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="mb-6">
          <Label htmlFor="customer" className="mb-2 block">
            Customer
          </Label>
          <Select value={customer} onValueChange={setCustomer}>
            <SelectTrigger id="customer">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="leslie">Leslie Alexander</SelectItem>
              <SelectItem value="john">John Smith</SelectItem>
              <SelectItem value="emma">Emma Wilson</SelectItem>
              <SelectItem value="michael">Michael Brown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="font-medium">Items</h3>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Your cart is empty</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 border-b pb-4">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={item.name}
                  className="w-[60px] h-[60px] rounded-md object-cover"
                />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">${item.price.toFixed(2)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(item.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Tax (10%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-medium text-lg pt-2 border-t mt-2">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Input placeholder="Promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
          <Button variant="outline">Apply</Button>
        </div>
      </div>

      <div className="p-4 border-t">
        <Button className="w-full" size="lg" disabled={items.length === 0 || !customer} onClick={onCheckout}>
          Checkout
        </Button>
      </div>
    </div>
  )
}
