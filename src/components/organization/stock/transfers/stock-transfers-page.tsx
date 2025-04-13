"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StockTransfersList } from "./stock-transfers-list"
import { CreateStockTransferSheet } from "./create-stock-transfer-sheet"
import { StockTransfersStats } from "./stock-transfers-stats"
import { Loader2, Search, Filter, ArrowUpDown } from "lucide-react"

export function StockTransfersPage() {
  const [transfers, setTransfers] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [createSheetOpen, setCreateSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [sortBy, setSortBy] = useState("date")
  const [sortOrder, setSortOrder] = useState("desc")
  const [activeTab, setActiveTab] = useState("all")
  const { toast } = useToast()

  const fetchTransfers = async (params = {}) => {
    setLoading(true)
    try {
      // Build query string from params
      const queryParams = new URLSearchParams({
        ...params,
        status: activeTab !== "all" ? activeTab : "",
        warehouseId: selectedWarehouse !== "all" ? selectedWarehouse : "",
        search: searchQuery,
        sortBy,
        sortOrder,
      }).toString()

      const response = await fetch(`/api/organization/stock/transfers?${queryParams}`)
      const data = await response.json()
      setTransfers(data.transfers)
      setWarehouses(data.warehouses)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching transfers:", error)
      toast({
        title: "Error",
        description: "Failed to load stock transfers. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransfers()
  }, [activeTab, selectedWarehouse, searchQuery, sortBy, sortOrder, toast])

  const handleCreateTransfer = async (transferData) => {
    try {
      const response = await fetch("/api/organization/stock/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the transfers list
        fetchTransfers()
        toast({
          title: "Success",
          description: "Stock transfer created successfully.",
        })
        setCreateSheetOpen(false)
      } else {
        throw new Error(data.message || "Failed to create stock transfer")
      }
    } catch (error) {
      console.error("Error creating transfer:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create stock transfer. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateTransfer = async (id, action, data = {}) => {
    try {
      const response = await fetch("/api/organization/stock/transfers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          action,
          ...data,
        }),
      })

      const responseData = await response.json()

      if (responseData.success) {
        // Update the transfer in the local state
        setTransfers((prevTransfers) =>
          prevTransfers.map((transfer) => (transfer.id === id ? responseData.transfer : transfer)),
        )

        toast({
          title: "Success",
          description: `Stock transfer ${action.replace("_", " ")} successfully.`,
        })

        return true
      } else {
        throw new Error(responseData.message || `Failed to ${action.replace("_", " ")} stock transfer`)
      }
    } catch (error) {
      console.error(`Error ${action.replace("_", " ")} transfer:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to ${action.replace("_", " ")} stock transfer. Please try again.`,
        variant: "destructive",
      })
      return false
    }
  }

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Transfers</h1>
          <p className="text-muted-foreground">Manage and track stock movements between warehouses</p>
        </div>
        <Button onClick={() => setCreateSheetOpen(true)} className="transition-all hover:bg-primary/90">
          Create Transfer
        </Button>
      </div>

      <StockTransfersStats transfers={transfers} />

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transfers by ID, warehouse, or product"
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
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px] transition-all border-muted hover:border-muted-foreground/50 focus:border-primary">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="sourceWarehouse">Source Warehouse</SelectItem>
                <SelectItem value="destinationWarehouse">Destination Warehouse</SelectItem>
                <SelectItem value="totalValue">Total Value</SelectItem>
                <SelectItem value="totalQuantity">Total Quantity</SelectItem>
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

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
          <TabsTrigger
            value="all"
            className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            All Transfers
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Pending
          </TabsTrigger>
          <TabsTrigger
            value="in_transit"
            className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            In Transit
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Completed
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Cancelled
          </TabsTrigger>
        </TabsList>
        <Card className="border-muted transition-all hover:border-muted-foreground/20">
          <CardHeader>
            <CardTitle>Stock Transfers</CardTitle>
            <CardDescription>
              {activeTab === "all"
                ? "View and manage all stock transfers across warehouses"
                : `View and manage ${activeTab.replace("_", " ")} stock transfers`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <StockTransfersList transfers={transfers} onUpdateTransfer={handleUpdateTransfer} />
            )}
          </CardContent>
        </Card>
      </Tabs>

      <CreateStockTransferSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onSubmit={handleCreateTransfer}
        warehouses={warehouses}
      />
    </div>
  )
}
