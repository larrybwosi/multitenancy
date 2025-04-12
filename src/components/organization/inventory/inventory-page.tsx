"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download, Filter } from "lucide-react"
import { InventoryList } from "./inventory-list"
import { InventoryStats } from "./inventory-stats"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function InventoryPage() {
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState<any[]>([])

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setInventory([
        {
          id: "prod_01",
          name: "Premium Laptop",
          sku: "LPT-PRO-15",
          category: "Electronics",
          warehouse: "Main Warehouse",
          quantity: 125,
          minStock: 20,
          price: 1299.99,
          status: "IN_STOCK",
          lastUpdated: "2023-10-15T14:30:00.000Z",
        },
        {
          id: "prod_02",
          name: "Wireless Headphones",
          sku: "WH-BT-100",
          category: "Electronics",
          warehouse: "Main Warehouse",
          quantity: 350,
          minStock: 50,
          price: 199.99,
          status: "IN_STOCK",
          lastUpdated: "2023-10-14T11:45:00.000Z",
        },
        {
          id: "prod_03",
          name: "Office Desk Chair",
          sku: "FRN-CHR-01",
          category: "Furniture",
          warehouse: "West Coast Distribution",
          quantity: 75,
          minStock: 15,
          price: 249.99,
          status: "IN_STOCK",
          lastUpdated: "2023-10-16T09:15:00.000Z",
        },
        {
          id: "prod_04",
          name: "Smartphone Case",
          sku: "ACC-PH-X12",
          category: "Accessories",
          warehouse: "Midwest Fulfillment",
          quantity: 12,
          minStock: 25,
          price: 29.99,
          status: "LOW_STOCK",
          lastUpdated: "2023-10-12T16:20:00.000Z",
        },
        {
          id: "prod_05",
          name: "Wireless Mouse",
          sku: "ACC-MS-W10",
          category: "Accessories",
          warehouse: "Main Warehouse",
          quantity: 0,
          minStock: 30,
          price: 49.99,
          status: "OUT_OF_STOCK",
          lastUpdated: "2023-10-15T10:10:00.000Z",
        },
        {
          id: "prod_06",
          name: "4K Monitor",
          sku: "DSP-MON-4K",
          category: "Electronics",
          warehouse: "Northeast Hub",
          quantity: 42,
          minStock: 10,
          price: 399.99,
          status: "IN_STOCK",
          lastUpdated: "2023-10-13T13:25:00.000Z",
        },
        {
          id: "prod_07",
          name: "Ergonomic Keyboard",
          sku: "ACC-KB-ERG",
          category: "Accessories",
          warehouse: "Main Warehouse",
          quantity: 8,
          minStock: 15,
          price: 89.99,
          status: "LOW_STOCK",
          lastUpdated: "2023-10-14T15:40:00.000Z",
        },
      ])
      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track and manage your organization&lsquo;s inventory across all
            warehouses
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/organization/inventory/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <InventoryStats inventory={inventory} loading={loading} />

      <Tabs defaultValue="all">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>
                View and manage all products in your inventory. Monitor stock
                levels, prices, and product details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryList
                inventory={inventory}
                loading={loading}
                filter="all"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>
                Products that are below their minimum stock level and need to be
                restocked soon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryList
                inventory={inventory}
                loading={loading}
                filter="low-stock"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="out-of-stock" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Out of Stock Items</CardTitle>
              <CardDescription>
                Products that are currently out of stock and need immediate
                attention.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryList
                inventory={inventory}
                loading={loading}
                filter="out-of-stock"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
