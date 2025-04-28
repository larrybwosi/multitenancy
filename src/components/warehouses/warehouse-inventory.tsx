"use client"

import { useState } from "react"
import { ExternalLink, Package, Search } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "@/components/chart"

interface WarehouseInventoryProps {
  id: string
}

export function WarehouseInventory({ id }: WarehouseInventoryProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Mock data for inventory
  const inventory = [
    {
      id: "1",
      name: "Smartphone X1",
      sku: "SP-X1-001",
      category: "Electronics",
      zone: "Zone A",
      stock: 342,
      reorderPoint: 50,
      status: "In Stock",
      value: 239400,
      lastMovement: "2023-04-15T10:30:00",
    },
    {
      id: "2",
      name: "Wireless Headphones",
      sku: "WH-BT-002",
      category: "Electronics",
      zone: "Zone A",
      stock: 128,
      reorderPoint: 30,
      status: "In Stock",
      value: 12800,
      lastMovement: "2023-04-14T14:45:00",
    },
    {
      id: "3",
      name: "Laptop Pro 15",
      sku: "LP-15-003",
      category: "Electronics",
      zone: "Zone B",
      stock: 24,
      reorderPoint: 20,
      status: "Low Stock",
      value: 28800,
      lastMovement: "2023-04-14T09:15:00",
    },
    {
      id: "4",
      name: "Smart Watch Series 5",
      sku: "SW-S5-004",
      category: "Wearables",
      zone: "Zone C",
      stock: 8,
      reorderPoint: 15,
      status: "Critical",
      value: 2400,
      lastMovement: "2023-04-13T16:20:00",
    },
    {
      id: "5",
      name: "Bluetooth Speaker",
      sku: "BS-JBL-005",
      category: "Audio",
      zone: "Zone A",
      stock: 56,
      reorderPoint: 20,
      status: "In Stock",
      value: 5600,
      lastMovement: "2023-04-12T11:10:00",
    },
    {
      id: "6",
      name: "Tablet Pro 10",
      sku: "TP-10-006",
      category: "Electronics",
      zone: "Zone B",
      stock: 18,
      reorderPoint: 25,
      status: "Low Stock",
      value: 9000,
      lastMovement: "2023-04-11T13:25:00",
    },
  ]

  // Get unique categories
  const categories = ["all", ...new Set(inventory.map((item) => item.category))]

  // Filter inventory based on search query and category
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Prepare data for category distribution chart
  const categoryData = categories
    .filter((category) => category !== "all")
    .map((category) => {
      const items = inventory.filter((item) => item.category === category)
      const totalStock = items.reduce((sum, item) => sum + item.stock, 0)
      const totalValue = items.reduce((sum, item) => sum + item.value, 0)
      return {
        category,
        stock: totalStock,
        value: totalValue,
      }
    })

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Inventory by Category</CardTitle>
            <CardDescription>Distribution of inventory across product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                  <XAxis dataKey="category" stroke={isDark ? "#888" : "#888"} />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#1f2937" : "#fff",
                      borderColor: isDark ? "#374151" : "#e5e7eb",
                      color: isDark ? "#fff" : "#000",
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="stock" name="Units in Stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="value" name="Total Value ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Summary</CardTitle>
            <CardDescription>Key metrics for warehouse inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">
                  {inventory.reduce((sum, item) => sum + item.stock, 0).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">
                  ${inventory.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Product Types</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-amber-500">
                  {inventory.filter((item) => item.status === "Low Stock" || item.status === "Critical").length}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Stock Status</h3>
              <div className="flex gap-2">
                <Badge className="bg-emerald-500">
                  {inventory.filter((item) => item.status === "In Stock").length} In Stock
                </Badge>
                <Badge className="bg-amber-500">
                  {inventory.filter((item) => item.status === "Low Stock").length} Low Stock
                </Badge>
                <Badge className="bg-destructive">
                  {inventory.filter((item) => item.status === "Critical").length} Critical
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Items
              </CardTitle>
              <CardDescription>All inventory items in this warehouse</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search items..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Last Movement</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item, index) => (
                <TableRow key={item.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <TableCell className="font-medium">
                    <Link href={`/inventory/${item.id}`} className="flex items-center hover:underline">
                      {item.name}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.zone}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="tabular-nums">{item.stock}</span>
                      <span className="ml-2 text-xs text-muted-foreground">/ {item.reorderPoint} min</span>
                    </div>
                  </TableCell>
                  <TableCell>${item.value.toLocaleString()}</TableCell>
                  <TableCell>{formatDate(item.lastMovement)}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.status === "In Stock"
                          ? "bg-emerald-500"
                          : item.status === "Low Stock"
                            ? "bg-amber-500"
                            : "bg-destructive"
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
