"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Search, Filter, ChevronDown, Clock, Calendar, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { OrderList } from "@/components/orders/order-list"
import { OrderDetails } from "@/components/orders/order-details"
import { CreateOrderDialog } from "@/components/orders/create-order-dialog"
import { fetchOrders } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

export function OrderManagement() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    // Simulate API call to fetch orders
    const loadOrders = async () => {
      try {
        const data = await fetchOrders()
        // Add more mock orders for demonstration
        const extendedOrders = [
          ...data,
          {
            id: "4",
            orderNumber: "2008-11A",
            date: "May 16, 2025",
            customerName: "Siti Nurhaliza",
            items: [
              { name: "Grilled Salmon", price: 120000, quantity: 1 },
              { name: "Steamed Rice", price: 15000, quantity: 2 },
            ],
            total: 150000,
            status: "Completed",
          },
          {
            id: "5",
            orderNumber: "2008-13A",
            date: "May 16, 2025",
            customerName: "Budi Santoso",
            items: [
              { name: "Mixed Seafood Platter", price: 250000, quantity: 1 },
              { name: "Iced Tea", price: 20000, quantity: 3 },
            ],
            total: 310000,
            status: "In Progress",
          },
          {
            id: "6",
            orderNumber: "2008-15A",
            date: "May 15, 2025",
            customerName: "Rina Wijaya",
            items: [
              { name: "Fish and Chips", price: 85000, quantity: 2 },
              { name: "Fresh Lime Juice", price: 25000, quantity: 2 },
            ],
            total: 220000,
            status: "Ready to Serve",
          },
          {
            id: "7",
            orderNumber: "2008-17A",
            date: "May 15, 2025",
            customerName: "Ahmad Fauzi",
            items: [
              { name: "Chili Crab", price: 180000, quantity: 1 },
              { name: "Steamed Rice", price: 15000, quantity: 2 },
            ],
            total: 210000,
            status: "Completed",
          },
        ]
        setOrders(extendedOrders)
        setIsLoading(false)
      } catch (error) {
        toast.error("Failed to load orders")
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [])

  const handleCreateOrder = (newOrder) => {
    const orderNumber = `${Math.floor(Math.random() * 10000)}-${Math.random().toString(36).substring(2, 4).toUpperCase()}`
    const order = {
      id: String(orders.length + 1),
      orderNumber,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      customerName: newOrder.customerName,
      items: newOrder.items,
      total: newOrder.total,
      status: "Pending",
    }

    setOrders([order, ...orders])
    toast.success("Order created successfully")
    setIsCreateDialogOpen(false)
  }

  const handleUpdateOrderStatus = (id, newStatus) => {
    setOrders(orders.map((order) => (order.id === id ? { ...order, status: newStatus } : order)))
    toast.success(`Order ${id} status updated to ${newStatus}`)
  }

  const handleDeleteOrder = (id) => {
    setOrders(orders.filter((order) => order.id !== id))
    setSelectedOrder(null)
    toast.success("Order deleted successfully")
  }

  const filteredOrders = orders
    .filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((order) => {
      if (statusFilter === "all") return true
      return order.status.toLowerCase() === statusFilter.toLowerCase()
    })
    .filter((order) => {
      if (activeTab === "all") return true
      if (activeTab === "today") {
        // Filter for today's orders
        const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        return order.date === today
      }
      if (activeTab === "pending") {
        return order.status === "Pending" || order.status === "In Progress"
      }
      if (activeTab === "completed") {
        return order.status === "Completed"
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.date) - new Date(a.date)
      }
      if (sortBy === "oldest") {
        return new Date(a.date) - new Date(b.date)
      }
      if (sortBy === "highest") {
        return b.total - a.total
      }
      if (sortBy === "lowest") {
        return a.total - b.total
      }
      return 0
    })

  const orderStats = {
    total: orders.length,
    completed: orders.filter((order) => order.status === "Completed").length,
    pending: orders.filter((order) => order.status === "Pending").length,
    inProgress: orders.filter((order) => order.status === "In Progress").length,
    readyToServe: orders.filter((order) => order.status === "Ready to Serve").length,
    canceled: orders.filter((order) => order.status === "Canceled").length,
    todayTotal: orders
      .filter((order) => {
        const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        return order.date === today
      })
      .reduce((sum, order) => sum + order.total, 0),
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">Create, view, and manage your restaurant orders</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
                <h3 className="text-2xl font-bold">{formatCurrency(orderStats.todayTotal)}</h3>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                <h3 className="text-2xl font-bold">{orderStats.pending + orderStats.inProgress}</h3>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready to Serve</p>
                <h3 className="text-2xl font-bold">{orderStats.readyToServe}</h3>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-green-600"
                >
                  <path d="M12 22a9.7 9.7 0 0 0 7.18-3.17c.4-.4.58-1 .47-1.55-.34-1.56-2.46-2.33-3.65-2.3-1 .03-1.92-.53-2.23-1.4-.5-1.5-2-2.6-3.77-2.6s-3.27 1.1-3.77 2.6c-.3.87-1.23 1.43-2.23 1.4-1.2-.03-3.31.74-3.65 2.3-.1.56.07 1.15.47 1.55A9.7 9.7 0 0 0 12 22Z" />
                  <path d="M8 22a9.7 9.7 0 0 1-7.18-3.17c-.4-.4-.58-1-.47-1.55.34-1.56 2.46-2.33 3.65-2.3 1-.03 1.92-.53 2.23-1.4.5-1.5 2-2.6 3.77-2.6" />
                  <path d="M12 6a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Orders</p>
                <h3 className="text-2xl font-bold">{orderStats.completed}</h3>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-blue-600"
                >
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>View and manage all your restaurant orders</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All Orders</TabsTrigger>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search orders..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 w-full md:w-auto">
                        <Filter className="h-4 w-4" />
                        <span>Status</span>
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Statuses</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pending</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("in progress")}>In Progress</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("ready to serve")}>
                        Ready to Serve
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("completed")}>Completed</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("canceled")}>Canceled</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 w-full md:w-auto">
                        <ArrowUpDown className="h-4 w-4" />
                        <span>Sort</span>
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortBy("newest")}>Newest First</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("oldest")}>Oldest First</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("highest")}>Highest Amount</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("lowest")}>Lowest Amount</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <Separator className="mb-4" />

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <OrderList
                orders={filteredOrders}
                onSelectOrder={setSelectedOrder}
                selectedOrderId={selectedOrder?.id}
                onUpdateStatus={handleUpdateOrderStatus}
              />
            )}
          </CardContent>
        </Card>

        {selectedOrder && (
          <OrderDetails order={selectedOrder} onDelete={handleDeleteOrder} onUpdateStatus={handleUpdateOrderStatus} />
        )}
      </div>

      <CreateOrderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateOrder={handleCreateOrder}
      />
    </div>
  )
}
