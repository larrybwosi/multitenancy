"use client"
import { useTheme } from "next-themes"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"

interface InventoryDetailsProps {
  id: string
}

export function InventoryDetails({ id }: InventoryDetailsProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  // Mock data for product details
  const product = {
    id: "1",
    name: "Smartphone X1",
    sku: "SP-X1-001",
    barcode: "123456789012",
    category: "Electronics",
    description:
      "The latest smartphone with advanced features including a high-resolution camera, fast processor, and extended battery life.",
    dimensions: {
      width: 7.5,
      height: 15.2,
      length: 0.8,
      unit: "cm",
    },
    weight: {
      value: 180,
      unit: "g",
    },
    basePrice: 699.99,
    baseCost: 450.0,
    reorderPoint: 50,
    stock: 342,
    status: "In Stock",
    variants: [
      {
        id: "1",
        name: "Black / 128GB",
        sku: "SP-X1-001-BK-128",
        stock: 120,
      },
      {
        id: "2",
        name: "Black / 256GB",
        sku: "SP-X1-001-BK-256",
        stock: 85,
      },
      {
        id: "3",
        name: "White / 128GB",
        sku: "SP-X1-001-WT-128",
        stock: 78,
      },
      {
        id: "4",
        name: "White / 256GB",
        sku: "SP-X1-001-WT-256",
        stock: 59,
      },
    ],
  }

  // Mock data for stock history
  const stockHistory = [
    { month: "Jan", stock: 280 },
    { month: "Feb", stock: 300 },
    { month: "Mar", stock: 280 },
    { month: "Apr", stock: 320 },
    { month: "May", stock: 350 },
    { month: "Jun", stock: 380 },
    { month: "Jul", stock: 420 },
    { month: "Aug", stock: 390 },
    { month: "Sep", stock: 360 },
    { month: "Oct", stock: 342 },
    { month: "Nov", stock: 342 },
    { month: "Dec", stock: 342 },
  ]

  // Mock data for variant distribution
  const variantDistribution = product.variants.map((variant) => ({
    name: variant.name,
    stock: variant.stock,
  }))

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Detailed information about this product</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-medium">Description</h3>
              <p className="text-sm text-muted-foreground">{product.description}</p>

              <h3 className="mb-2 mt-4 text-sm font-medium">Details</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">SKU:</span>
                  <span className="text-muted-foreground">{product.sku}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Barcode:</span>
                  <span className="text-muted-foreground">{product.barcode}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Category:</span>
                  <span className="text-muted-foreground">{product.category}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Dimensions:</span>
                  <span className="text-muted-foreground">
                    {product.dimensions.width} × {product.dimensions.height} × {product.dimensions.length}{" "}
                    {product.dimensions.unit}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Weight:</span>
                  <span className="text-muted-foreground">
                    {product.weight.value} {product.weight.unit}
                  </span>
                </div>
              </div>

              <h3 className="mb-2 mt-4 text-sm font-medium">Pricing</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Base Price:</span>
                  <span className="text-muted-foreground">${product.basePrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Base Cost:</span>
                  <span className="text-muted-foreground">${product.baseCost.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Margin:</span>
                  <span className="text-muted-foreground">
                    {(((product.basePrice - product.baseCost) / product.basePrice) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              <h3 className="mb-2 mt-4 text-sm font-medium">Inventory</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Total Stock:</span>
                  <span className="text-muted-foreground">{product.stock} units</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Reorder Point:</span>
                  <span className="text-muted-foreground">{product.reorderPoint} units</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">Status:</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      product.status === "In Stock"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500"
                        : product.status === "Low Stock"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-500"
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Stock History</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stockHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                    <XAxis dataKey="month" stroke={isDark ? "#888" : "#888"} tick={{ fontSize: 12 }} />
                    <YAxis stroke={isDark ? "#888" : "#888"} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`${value} units`, "Stock"]}
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                        color: isDark ? "#fff" : "#000",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="stock"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                      name="Stock Level"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <h3 className="mb-2 mt-6 text-sm font-medium">Variant Distribution</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={variantDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                    <XAxis dataKey="name" stroke={isDark ? "#888" : "#888"} tick={{ fontSize: 10 }} />
                    <YAxis stroke={isDark ? "#888" : "#888"} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`${value} units`, "Stock"]}
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        borderColor: isDark ? "#374151" : "#e5e7eb",
                        color: isDark ? "#fff" : "#000",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="stock" fill="#8884d8" name="Stock by Variant" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
