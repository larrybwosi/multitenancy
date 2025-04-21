"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StockLevelsList } from "./stock-levels-list"
import { StockLevelsStats } from "./stock-levels-stats"
import { StockLevelsChart } from "./stock-levels-chart"
import { Loader2, Search, Filter, ArrowUpDown, AlertCircle, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

interface Location {
  id: string
  name: string
  location: string
}

interface Category {
  id: string
  name: string
}

interface StockLevel {
  productId: string
  productName: string
  sku: string
  category: string
  imageUrls: string[]
  variantStocks: {
    warehouseId: string
    warehouseName: string
    quantity: number
    minLevel: number
    maxLevel: number
    reorderPoint: number
    reorderQuantity: number
    location: string
    lastCountDate: Date | null
  }[]
  totalQuantity: number
  unitCost: number
  totalValue: number
  lastUpdated: string
  status: string
}

export function StockLevelsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [stockStatus, setStockStatus] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [viewMode, setViewMode] = useState("list")
  const [page, setPage] = useState(1)
  const limit = 50

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [
      'stockLevels',
      selectedLocation,
      selectedCategory,
      stockStatus,
      searchQuery,
      sortBy,
      sortOrder,
      page,
      limit
    ],
    queryFn: async ():Promise<{ stockLevels: StockLevel[]; locations: Location[]; categories: Category[] }> => {
      const queryParams = new URLSearchParams({
        warehouseId: selectedLocation,
        category: selectedCategory,
        status: stockStatus,
        search: searchQuery,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: limit.toString()
      }).toString()

      const response = await fetch(`/api/stock/levels?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch stock levels')
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (error: Error) => {
      toast.error("Error loading stock data", {
        description: error.message,
      })
    }
  })

  const stockLevels = data?.stockLevels || []
  const locations = data?.locations || []
  const categories = data?.categories || []
  const totalPages = Math.ceil((data?.pagination?.total || 0) / limit)

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  const goToPrevPage = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleRetry = () => {
    refetch()
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedLocation("all")
    setSelectedCategory("all")
    setStockStatus("all")
    setPage(1)
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {isRefetching ? "Refreshing data..." : "Loading stock levels..."}
          </p>
        </div>
      )
    }

    if (isError) {
      return (
        <div className="py-6">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error?.message || "Failed to load stock data"}</AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button 
              variant="outline"
              onClick={handleRetry}
              disabled={isRefetching}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              {isRefetching ? "Retrying..." : "Retry"}
            </Button>
          </div>
        </div>
      )
    }

    if (stockLevels.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No stock data found</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {searchQuery || selectedLocation !== "all" || selectedCategory !== "all" || stockStatus !== "all" 
              ? "Try adjusting your filters or search criteria"
              : "There are no products in your inventory yet"}
          </p>
          {(searchQuery || selectedLocation !== "all" || selectedCategory !== "all" || stockStatus !== "all") && (
            <Button 
              variant="outline" 
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          )}
        </div>
      )
    }

    return (
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
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full sm:w-[180px] transition-all border-muted hover:border-muted-foreground/50 focus:border-primary">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
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
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
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
                <ArrowUpDown className={`h-4 w-4 ${sortOrder === "asc" ? "rotate-0" : "rotate-180"} transition-transform`} />
                <span className="sr-only">Toggle sort order</span>
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="list" value={viewMode} onValueChange={setViewMode} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="list" className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                List View
              </TabsTrigger>
              <TabsTrigger value="chart" className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Chart View
              </TabsTrigger>
            </TabsList>
            <div className="text-sm text-muted-foreground">
              Showing {stockLevels.length} of {data?.pagination?.total || 0} products
            </div>
          </div>

          <TabsContent value="list">
            <Card className="border-muted transition-all hover:border-muted-foreground/20">
              <CardHeader>
                <CardTitle>Stock Inventory</CardTitle>
                <CardDescription>View and filter current stock levels across all locations</CardDescription>
              </CardHeader>
              <CardContent>
                <StockLevelsList stockLevels={stockLevels} selectedLocation={selectedLocation} />
                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPrevPage}
                      disabled={page === 1 || isLoading}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={page === totalPages || isLoading}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chart">
            <Card className="border-muted transition-all hover:border-muted-foreground/20">
              <CardHeader>
                <CardTitle>Stock Visualization</CardTitle>
                <CardDescription>Visual representation of stock levels across locations</CardDescription>
              </CardHeader>
              <CardContent>
                <StockLevelsChart stockLevels={stockLevels} selectedLocation={selectedLocation} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock Levels</h1>
        <p className="text-muted-foreground">Monitor and manage stock levels across all locations</p>
      </div>

      {renderContent()}
    </div>
  )
}