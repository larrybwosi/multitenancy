"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Search, Trash, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { POSCart } from "./pos-cart"
import { POSProductGrid } from "./pos-product-grid"
import { POSRecentSales } from "./pos-recent-sales"
import { POSCheckoutSheet } from "./pos-checkout-sheet"

export function POSPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [cart, setCart] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [showCheckoutSheet, setShowCheckoutSheet] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const response = await fetch("/api/organization/pos")
        const data = await response.json()
        setProducts(data.products)
        setCustomers(data.customers)
        setRecentSales(data.recentSales)
      } catch (error) {
        console.error("Error fetching POS data:", error)
        toast({
          title: "Error",
          description: "Failed to load POS data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const addToCart = (product: any) => {
    const existingItem = cart.find((item) => item.id === product.id)

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item,
        ),
      )
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          total: product.price,
        },
      ])
    }

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const updateCartItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id)
      return
    }

    setCart(cart.map((item) => (item.id === id ? { ...item, quantity, total: quantity * item.price } : item)))
  }

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setCart([])
  }

  const handleCheckout = async (checkoutData: any) => {
    try {
      const saleData = {
        items: cart,
        customer: checkoutData.customer,
        paymentMethod: checkoutData.paymentMethod,
        total: cart.reduce((sum, item) => sum + item.total, 0),
      }

      const response = await fetch("/api/organization/pos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      })

      if (!response.ok) throw new Error("Failed to process sale")

      const result = await response.json()

      toast({
        title: "Sale completed",
        description: `Sale #${result.id} has been successfully processed.`,
      })

      // Update recent sales
      setRecentSales([
        {
          id: result.id,
          customer: checkoutData.customer || "Guest",
          total: saleData.total,
          items: cart.length,
          date: result.date,
          status: "COMPLETED",
        },
        ...recentSales.slice(0, 3),
      ])

      // Clear cart
      clearCart()

      return true
    } catch (error) {
      console.error("Error processing sale:", error)
      toast({
        title: "Error",
        description: "Failed to process sale. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  // Get unique categories for filtering
  const categories = ["all", ...new Set(products.map((product) => product.category.toLowerCase()))]

  // Filter products based on search query and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === "all" || product.category.toLowerCase() === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Calculate cart totals
  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <p className="text-muted-foreground">Process sales and manage transactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full sm:w-auto">
                  <TabsList className="w-full grid grid-cols-3">
                    {categories.map((category) => (
                      <TabsTrigger key={category} value={category} className="capitalize">
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-[120px] w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <POSProductGrid products={filteredProducts} onAddToCart={addToCart} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>View your most recent transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-[200px] w-full rounded-lg" /> : <POSRecentSales sales={recentSales} />}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Current Sale</span>
                <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
                  {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
                </Badge>
              </CardTitle>
              <CardDescription>Items in the current transaction</CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <POSCart items={cart} onUpdateQuantity={updateCartItemQuantity} onRemoveItem={removeFromCart} />

              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Subtotal</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Tax (8%)</span>
                  <span>{formatCurrency(cartTotal * 0.08)}</span>
                </div>
                <div className="border-t pt-4 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(cartTotal * 1.08)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  disabled={cart.length === 0}
                  onClick={() => setShowCheckoutSheet(true)}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Checkout
                </Button>
                <Button variant="outline" className="w-full" size="lg" disabled={cart.length === 0} onClick={clearCart}>
                  <Trash className="mr-2 h-4 w-4" />
                  Clear Cart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <POSCheckoutSheet
        open={showCheckoutSheet}
        onOpenChange={setShowCheckoutSheet}
        customers={customers}
        cartTotal={cartTotal * 1.08}
        onCheckout={handleCheckout}
      />
    </div>
  )
}
