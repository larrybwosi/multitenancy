"use client"

import { useState } from "react"
import { ArrowDownLeft, ArrowUpRight, Calendar, Search } from "lucide-react"
import { useTheme } from "next-themes"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "@/components/ui/chart"

interface WarehouseMovementsProps {
  id: string
}

export function WarehouseMovements({ id }: WarehouseMovementsProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  })

  // Mock data for movements
  const movements = [
    {
      id: "1",
      type: "TRANSFER",
      product: "Smartphone X1",
      quantity: 50,
      from: "Main Warehouse",
      to: "East Storage Facility",
      date: "2023-04-15T10:30:00",
      reference: "TRF-001",
      initiatedBy: "John Smith",
    },
    {
      id: "2",
      type: "PURCHASE_RECEIPT",
      product: "Wireless Headphones",
      quantity: 200,
      from: "Supplier",
      to: "Main Warehouse",
      date: "2023-04-14T14:45:00",
      reference: "PO-1234",
      initiatedBy: "Sarah Johnson",
    },
    {
      id: "3",
      type: "SALE",
      product: "Laptop Pro 15",
      quantity: 5,
      from: "Main Warehouse",
      to: "Customer",
      date: "2023-04-14T09:15:00",
      reference: "SO-5678",
      initiatedBy: "Michael Brown",
    },
    {
      id: "4",
      type: "ADJUSTMENT_IN",
      product: "Smart Watch Series 5",
      quantity: 10,
      from: "Inventory Count",
      to: "Main Warehouse",
      date: "2023-04-13T16:20:00",
      reference: "ADJ-001",
      initiatedBy: "Emily Davis",
    },
    {
      id: "5",
      type: "TRANSFER",
      product: "Bluetooth Speaker",
      quantity: 25,
      from: "East Storage Facility",
      to: "Main Warehouse",
      date: "2023-04-12T11:10:00",
      reference: "TRF-002",
      initiatedBy: "John Smith",
    },
    {
      id: "6",
      type: "SALE",
      product: "Tablet Pro 10",
      quantity: 8,
      from: "Main Warehouse",
      to: "Customer",
      date: "2023-04-11T13:25:00",
      reference: "SO-5679",
      initiatedBy: "Michael Brown",
    },
    {
      id: "7",
      type: "PURCHASE_RECEIPT",
      product: "Wireless Charger",
      quantity: 100,
      from: "Supplier",
      to: "Main Warehouse",
      date: "2023-04-10T09:45:00",
      reference: "PO-1235",
      initiatedBy: "Sarah Johnson",
    },
  ]

  // Get unique movement types
  const types = ["all", ...new Set(movements.map((movement) => movement.type))]

  // Filter movements based on search query, type, and date range
  const filteredMovements = movements.filter((movement) => {
    const matchesSearch =
      movement.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movement.reference.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || movement.type === typeFilter
    const movementDate = new Date(movement.date)
    const matchesDate = movementDate >= dateRange.from && movementDate <= dateRange.to
    return matchesSearch && matchesType && matchesDate
  })

  // Prepare data for movement trend chart
  const movementTrendData = [
    { date: "Apr 10", inbound: 100, outbound: 0 },
    { date: "Apr 11", inbound: 0, outbound: 8 },
    { date: "Apr 12", inbound: 25, outbound: 0 },
    { date: "Apr 13", inbound: 10, outbound: 0 },
    { date: "Apr 14", inbound: 200, outbound: 5 },
    { date: "Apr 15", inbound: 0, outbound: 50 },
  ]

  // Function to format date
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
            <CardTitle>Movement Trends</CardTitle>
            <CardDescription>Inbound vs outbound movements over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={movementTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                  <XAxis dataKey="date" stroke={isDark ? "#888" : "#888"} />
                  <YAxis stroke={isDark ? "#888" : "#888"} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? "#1f2937" : "#fff",
                      borderColor: isDark ? "#374151" : "#e5e7eb",
                      color: isDark ? "#fff" : "#000",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="inbound"
                    name="Inbound"
                    stroke="#10b981"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="outbound"
                    name="Outbound"
                    stroke="#ef4444"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movement Summary</CardTitle>
            <CardDescription>Key metrics for stock movements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Movements</p>
                <p className="text-2xl font-bold">{movements.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold">
                  {movements.reduce((sum, movement) => sum + movement.quantity, 0).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Inbound</p>
                <p className="text-2xl font-bold text-emerald-500">
                  {movements
                    .filter(
                      (m) =>
                        m.type === "PURCHASE_RECEIPT" ||
                        m.type === "ADJUSTMENT_IN" ||
                        (m.type === "TRANSFER" && m.to === "Main Warehouse"),
                    )
                    .reduce((sum, m) => sum + m.quantity, 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Outbound</p>
                <p className="text-2xl font-bold text-rose-500">
                  {movements
                    .filter((m) => m.type === "SALE" || (m.type === "TRANSFER" && m.from === "Main Warehouse"))
                    .reduce((sum, m) => sum + m.quantity, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Movement Types</h3>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-emerald-500">
                  {movements.filter((m) => m.type === "PURCHASE_RECEIPT").length} Receipts
                </Badge>
                <Badge className="bg-rose-500">{movements.filter((m) => m.type === "SALE").length} Sales</Badge>
                <Badge className="bg-blue-500">{movements.filter((m) => m.type === "TRANSFER").length} Transfers</Badge>
                <Badge className="bg-amber-500">
                  {movements.filter((m) => m.type === "ADJUSTMENT_IN").length} Adjustments
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
              <CardTitle>Movement History</CardTitle>
              <CardDescription>Recent stock movements for this warehouse</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search movements..."
                  className="pl-8 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type === "all"
                        ? "All Types"
                        : type === "PURCHASE_RECEIPT"
                          ? "Receipt"
                          : type === "SALE"
                            ? "Sale"
                            : type === "TRANSFER"
                              ? "Transfer"
                              : "Adjustment"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Initiated By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.map((movement, index) => (
                <TableRow key={movement.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {movement.type === "PURCHASE_RECEIPT" ||
                      movement.type === "ADJUSTMENT_IN" ||
                      (movement.type === "TRANSFER" && movement.to === "Main Warehouse") ? (
                        <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-rose-500" />
                      )}
                      <Badge
                        className={
                          movement.type === "PURCHASE_RECEIPT"
                            ? "bg-emerald-500"
                            : movement.type === "SALE"
                              ? "bg-rose-500"
                              : movement.type === "TRANSFER"
                                ? "bg-blue-500"
                                : "bg-amber-500"
                        }
                      >
                        {movement.type === "PURCHASE_RECEIPT"
                          ? "Receipt"
                          : movement.type === "SALE"
                            ? "Sale"
                            : movement.type === "TRANSFER"
                              ? "Transfer"
                              : "Adjustment"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{movement.product}</TableCell>
                  <TableCell>{movement.quantity}</TableCell>
                  <TableCell>{movement.from}</TableCell>
                  <TableCell>{movement.to}</TableCell>
                  <TableCell>{movement.reference}</TableCell>
                  <TableCell>{formatDate(movement.date)}</TableCell>
                  <TableCell>{movement.initiatedBy}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
