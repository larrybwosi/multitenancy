"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download, Filter } from "lucide-react"
import { ProductList } from "./product-list"
import { ProductStats } from "./product-stats"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ProductsPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setProducts([
        {
          id: "prod_01",
          name: "Premium Laptop",
          description: "High-performance laptop with 16GB RAM and 512GB SSD",
          sku: "LPT-PRO-15",
          category: "Electronics",
          price: 1299.99,
          costPrice: 900,
          status: "ACTIVE",
          variants: 3,
          lastUpdated: "2023-10-15T14:30:00.000Z",
        },
        {
          id: "prod_02",
          name: "Wireless Headphones",
          description: "Noise-cancelling wireless headphones with 30-hour battery life",
          sku: "WH-BT-100",
          category: "Electronics",
          price: 199.99,
          costPrice: 120,
          status: "ACTIVE",
          variants: 4,
          lastUpdated: "2023-10-14T11:45:00.000Z",
        },
        {
          id: "prod_03",
          name: "Office Desk Chair",
          description: "Ergonomic office chair with lumbar support and adjustable height",
          sku: "FRN-CHR-01",
          category: "Furniture",
          price: 249.99,
          costPrice: 175,
          status: "ACTIVE",
          variants: 2,
          lastUpdated: "2023-10-16T09:15:00.000Z",
        },
        {
          id: "prod_04",
          name: "Smartphone Case",
          description: "Protective case for smartphones with shock absorption",
          sku: "ACC-PH-X12",
          category: "Accessories",
          price: 29.99,
          costPrice: 15,
          status: "ACTIVE",
          variants: 12,
          lastUpdated: "2023-10-12T16:20:00.000Z",
        },
        {
          id: "prod_05",
          name: "Wireless Mouse",
          description: "Ergonomic wireless mouse with adjustable DPI",
          sku: "ACC-MS-W10",
          category: "Accessories",
          price: 49.99,
          costPrice: 30,
          status: "INACTIVE",
          variants: 3,
          lastUpdated: "2023-10-15T10:10:00.000Z",
        },
        {
          id: "prod_06",
          name: "4K Monitor",
          description: "27-inch 4K UHD monitor with HDR support",
          sku: "DSP-MON-4K",
          category: "Electronics",
          price: 399.99,
          costPrice: 280,
          status: "ACTIVE",
          variants: 2,
          lastUpdated: "2023-10-13T13:25:00.000Z",
        },
        {
          id: "prod_07",
          name: "Ergonomic Keyboard",
          description: "Split ergonomic keyboard with mechanical switches",
          sku: "ACC-KB-ERG",
          category: "Accessories",
          price: 89.99,
          costPrice: 55,
          status: "ACTIVE",
          variants: 2,
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
          <h1 className="text-2xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">Manage your organization's products and variants</p>
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
            <Link href="/organization/products/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <ProductStats products={products} loading={loading} />

      <Tabs defaultValue="all">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>
                View and manage all products. Monitor pricing, variants, and product details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductList products={products} loading={loading} filter="all" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Active Products</CardTitle>
              <CardDescription>Products that are currently active and available for sale.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductList products={products} loading={loading} filter="active" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Inactive Products</CardTitle>
              <CardDescription>Products that are currently inactive or discontinued.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductList products={products} loading={loading} filter="inactive" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
