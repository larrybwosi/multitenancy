"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StockLevelsList } from "./stock-levels-list"
import { StockLevelsStats } from "./stock-levels-stats"
import { StockLevelsChart } from "./stock-levels-chart"
import { Loader2, Search, Filter, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function StockLevelsPage() {
  const [stockLevels, setStockLevels] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [stockStatus, setStockStatus] = useState("all")
  const [sortBy, setSortBy] = useState("productName")
  const [sortOrder, setSortOrder] = useState("asc")
  const [viewMode, setViewMode] = useState("list")
  const { toast } = useToast()

  const fetchStockLevels = async () => {
    setLoading(true)
    try {
      // Build query string from params
      const queryParams = new URLSearchParams({
        warehouseId: selectedWarehouse,
        category: selectedCategory,
        status: stockStatus,
        search: searchQuery,
        sortBy,
        sortOrder,
      }).toString()

      const response = await fetch(`/api/organization/stock/levels?${queryParams}`)
      const data = await response.json()
      setStockLevels(data.stockLevels)
      setWarehouses(data.warehouses)
      setCategories(data.categories)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching stock levels:", error)
      toast({
        title: "Error",
        description: "Failed to load stock levels. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStockLevels()
  }, [selectedWarehouse, selectedCategory, stockStatus, searchQuery, sortBy, sortOrder, toast])

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock Levels</h1>
        <p className="text-muted-foreground">Monitor and manage stock levels across all warehouses</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <StockLevelsStats stockLevels={stockLevels} />

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name, SKU, or category"
                className="pl-8 transition-all border-muted hover:border-muted-foreground/50 focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-full sm:w-[180px] transition-all border-muted hover:border-muted-foreground/50 focus:border-primary">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px] transition-all border-muted hover:border-muted-foreground/50 focus:border-primary">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stockStatus} onValueChange={setStockStatus}>
                <SelectTrigger className="w-full sm:w-[180px] transition-all border-muted hover:border-muted-foreground/50 focus:border-primary">
                  <SelectValue placeholder="Stock status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="normal">Normal Stock</SelectItem>
                  <SelectItem value="overstock">Overstock</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[180px] transition-all border-muted hover:border-muted-foreground/50 focus:border-primary">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="productName">Product Name</SelectItem>
                    <SelectItem value="sku">SKU</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="totalQuantity">Total Quantity</SelectItem>
                    <SelectItem value="totalValue">Total Value</SelectItem>
                    <SelectItem value="lastUpdated">Last Updated</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleSortOrder}
                  className="transition-all border-muted hover:border-muted-foreground/50 focus:border-primary"
                >
                  <ArrowUpDown
                    className={`h-4 w-4 ${sortOrder === "asc" ? "rotate-0" : "rotate-180"} transition-transform`}
                  />
                  <span className="sr-only">Toggle sort order</span>
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="list" value={viewMode} onValueChange={setViewMode} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger
                  value="list"
                  className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  List View
                </TabsTrigger>
                <TabsTrigger
                  value="chart"
                  className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Chart View
                </TabsTrigger>
              </TabsList>
              <div className="text-sm text-muted-foreground">Showing {stockLevels.length} products</div>
            </div>

            <TabsContent value="list">
              <Card className="border-muted transition-all hover:border-muted-foreground/20">
                <CardHeader>
                  <CardTitle>Stock Inventory</CardTitle>
                  <CardDescription>View and filter current stock levels across all warehouses</CardDescription>
                </CardHeader>
                <CardContent>
                  <StockLevelsList stockLevels={stockLevels} selectedWarehouse={selectedWarehouse} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chart">
              <Card className="border-muted transition-all hover:border-muted-foreground/20">
                <CardHeader>
                  <CardTitle>Stock Visualization</CardTitle>
                  <CardDescription>Visual representation of stock levels across warehouses</CardDescription>
                </CardHeader>
                <CardContent>
                  <StockLevelsChart stockLevels={stockLevels} selectedWarehouse={selectedWarehouse} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
