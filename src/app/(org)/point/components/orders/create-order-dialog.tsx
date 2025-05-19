"use client"

import { useState, useEffect } from "react"
import { Plus, Minus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"

export function CreateOrderDialog({ open, onOpenChange, onCreateOrder }) {
  const [tables, setTables] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [orderType, setOrderType] = useState("dine-in")
  const [selectedTable, setSelectedTable] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [cartItems, setCartItems] = useState([])

  useEffect(() => {
    if (open) {
      // Simulate API call to fetch tables, products, and categories
      setTimeout(() => {
        setTables([
          { id: 1, name: "Table 1", capacity: 4, status: "available" },
          { id: 2, name: "Table 2", capacity: 2, status: "occupied" },
          { id: 3, name: "Table 3", capacity: 6, status: "available" },
          { id: 4, name: "Table 4", capacity: 4, status: "reserved" },
          { id: 5, name: "Table 5", capacity: 8, status: "available" },
        ])

        setCategories([
          { id: 0, name: "all", label: "All" },
          { id: 1, name: "appetizers", label: "Appetizers" },
          { id: 2, name: "seafood-platters", label: "Seafood Platters" },
          { id: 3, name: "fish", label: "Fish" },
          { id: 4, name: "shrimp", label: "Shrimp" },
          { id: 5, name: "crab", label: "Crab" },
          { id: 6, name: "squid", label: "Squid" },
          { id: 7, name: "rice", label: "Rice" },
          { id: 8, name: "drinks", label: "Drinks" },
          { id: 9, name: "dessert", label: "Dessert" },
        ])

        setProducts([
          {
            id: 1,
            name: "Spring Rolls",
            price: 45000,
            category: "appetizers",
            image: "/placeholder.svg?height=80&width=80",
          },
          {
            id: 2,
            name: "Calamari Rings",
            price: 65000,
            category: "appetizers",
            image: "/placeholder.svg?height=80&width=80",
          },
          {
            id: 3,
            name: "Mixed Seafood Platter",
            price: 250000,
            category: "seafood-platters",
            image: "/placeholder.svg?height=80&width=80",
          },
          {
            id: 4,
            name: "Spicy shrimp with rice",
            price: 70000,
            category: "shrimp",
            image: "/placeholder.svg?height=80&width=80",
          },
          {
            id: 5,
            name: "Thai hot seafood soup",
            price: 80000,
            category: "seafood-platters",
            image: "/placeholder.svg?height=80&width=80",
          },
          {
            id: 6,
            name: "Grilled Salmon",
            price: 120000,
            category: "fish",
            image: "/placeholder.svg?height=80&width=80",
          },
          {
            id: 7,
            name: "Fish and Chips",
            price: 85000,
            category: "fish",
            image: "/placeholder.svg?height=80&width=80",
          },
          {
            id: 8,
            name: "Chili Crab",
            price: 180000,
            category: "crab",
            image: "/placeholder.svg?height=80&width=80",
          },
          {
            id: 9,
            name: "Fresh Lime Juice",
            price: 25000,
            category: "drinks",
            image: "/placeholder.svg?height=80&width=80",
          },
          {
            id: 10,
            name: "Mango Sticky Rice",
            price: 45000,
            category: "dessert",
            image: "/placeholder.svg?height=80&width=80",
          },
        ])

        setIsLoading(false)
      }, 1000)
    } else {
      // Reset form when dialog closes
      setCartItems([])
      setCustomerName("")
      setSelectedTable("")
      setOrderType("dine-in")
      setActiveCategory("all")
      setSearchQuery("")
    }
  }, [open])

  const handleAddToCart = (product) => {
    const existingItemIndex = cartItems.findIndex((item) => item.id === product.id)

    if (existingItemIndex !== -1) {
      const updatedItems = [...cartItems]
      updatedItems[existingItemIndex].quantity += 1
      setCartItems(updatedItems)
    } else {
      setCartItems([
        ...cartItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ])
    }
  }

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter((item) => item.id !== id))
    } else {
      setCartItems(cartItems.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const handleRemoveItem = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id))
  }

  const handleCreateOrder = () => {
    if (cartItems.length === 0) return

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    onCreateOrder({
      customerName: customerName || "Guest",
      orderType,
      tableNumber: selectedTable,
      items: cartItems,
      total,
    })
  }

  const filteredProducts = products.filter(
    (product) =>
      (activeCategory === "all" || product.category === activeCategory) &&
      product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>Add items to the order and provide customer details</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Order Type</Label>
              <Tabs defaultValue="dine-in" value={orderType} onValueChange={setOrderType}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="dine-in">Dine In</TabsTrigger>
                  <TabsTrigger value="takeaway">Takeaway</TabsTrigger>
                  <TabsTrigger value="delivery">Delivery</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name</Label>
                <Input
                  id="customer-name"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              {orderType === "dine-in" && (
                <div className="space-y-2">
                  <Label htmlFor="table">Table</Label>
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger id="table">
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables
                        .filter((table) => table.status === "available")
                        .map((table) => (
                          <SelectItem key={table.id} value={table.name}>
                            {table.name} ({table.capacity} seats)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Products</Label>
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex overflow-x-auto pb-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.name ? "default" : "outline"}
                    className="mr-2 whitespace-nowrap"
                    onClick={() => setActiveCategory(category.name)}
                  >
                    {category.label}
                  </Button>
                ))}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex items-center p-2">
                          <img
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            className="w-12 h-12 rounded-md object-cover mr-2"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{formatCurrency(product.price)}</div>
                          </div>
                          <Button size="sm" onClick={() => handleAddToCart(product)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-md p-4 space-y-4">
            <div className="font-medium">Order Summary</div>

            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No items added yet</div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="w-10 h-10 rounded-md object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{formatCurrency(item.price)}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
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
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (10%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleCreateOrder} disabled={cartItems.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
