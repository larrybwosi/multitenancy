"use client"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowDown, ArrowUp, Download, Filter, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AnalyticsDashboardSkeleton } from "@/components/skeletons/analytics-dashboard-skeleton"
import { fetchAnalytics } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"

export function AnalyticsDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
  })

  if (isLoading) return <AnalyticsDashboardSkeleton />

  if (error) {
    toast.error("Failed to load analytics data")
    return <div>Error loading analytics data</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.revenue.value)}
          change={data.revenue.change}
          trend={data.revenue.trend}
          subtitle="from last month"
        />
        <StatCard
          title="Total Customer"
          value={data.customers.value.toLocaleString()}
          change={data.customers.change}
          trend={data.customers.trend}
          subtitle="from last month"
        />
        <StatCard
          title="Total Transaction"
          value={data.transactions.value.toLocaleString()}
          change={data.transactions.change}
          trend={data.transactions.trend}
          subtitle="from last month"
        />
        <StatCard
          title="Total Product"
          value={data.products.value.toLocaleString()}
          change={data.products.change}
          trend={data.products.trend}
          subtitle="from last month"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sales Insight</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="product-sales">
            <TabsList className="mb-4">
              <TabsTrigger value="product-sales">Product Sales</TabsTrigger>
              <TabsTrigger value="product-view">Product View</TabsTrigger>
              <TabsTrigger value="product-purchase">Product Purchase</TabsTrigger>
            </TabsList>
            <TabsContent value="product-sales">
              <div className="h-[300px] w-full relative">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="text-2xl font-bold">{formatCurrency(572830)}</div>
                  <div className="text-sm text-muted-foreground">Avg. Product Sales</div>
                </div>
                <img
                  src="/placeholder.svg?height=300&width=800"
                  alt="Sales chart"
                  className="w-full h-full object-cover"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">{order.icon}</div>
                        {order.productName}
                      </div>
                    </TableCell>
                    <TableCell>{order.orderId}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.status}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Selling Product</CardTitle>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">{product.icon}</div>
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.stock} Stock remaining</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{product.sales.toLocaleString()} sales</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, change, trend, subtitle }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 text-xs">
          <span className={trend === "up" ? "text-emerald-500" : "text-rose-500"}>
            {trend === "up" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          </span>
          <span className={trend === "up" ? "text-emerald-500" : "text-rose-500"}>{change}%</span>
          <span className="text-muted-foreground">{subtitle}</span>
        </div>
      </CardContent>
    </Card>
  )
}
