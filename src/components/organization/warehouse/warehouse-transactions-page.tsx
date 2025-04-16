"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Download, Filter, Calendar } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { InventoryLocation } from "@prisma/client"

interface WarehouseTransactionsPageProps {
  id: string
}

export function WarehouseTransactionsPage({ id }: WarehouseTransactionsPageProps) {
  const [loading, setLoading] = useState(true)
  const [warehouse, setWarehouse] = useState<InventoryLocation| null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("ALL")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch warehouse details
        const warehouseResponse = await fetch(`/api/warehouse/${id}`)
        const warehouseData = await warehouseResponse.json()
        setWarehouse(warehouseData.warehouse)

        // Fetch transactions
        const transactionsResponse = await fetch(`/api/warehouse/${id}/transactions`)
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData.transactions)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Error", {
          description: "Failed to load warehouse data. Please try again.",
        });
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  // Filter transactions based on search query and type filter
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.user.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = filterType === "ALL" || transaction.type === filterType

    return matchesSearch && matchesType
  })

  if (loading) {
    return <TransactionsPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/organization/warehouse/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{warehouse?.name} - Transactions</h1>
            <p className="text-muted-foreground">View all stock movements for this warehouse</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center border rounded-md p-1 bg-white">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Last 30 Days</span>
            </Button>
            <Select defaultValue="monthly">
              <SelectTrigger className="border-0 w-[130px] p-1">
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Transactions</CardTitle>
          <CardDescription>Track all stock movements in and out of this warehouse.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Transactions</SelectItem>
                  <SelectItem value="IN">Stock In</SelectItem>
                  <SelectItem value="OUT">Stock Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{transaction.reference}</TableCell>
                        <TableCell>{transaction.productName}</TableCell>
                        <TableCell>
                          <TransactionTypeBadge type={transaction.type} />
                        </TableCell>
                        <TableCell className="text-right">{transaction.quantity}</TableCell>
                        <TableCell>{transaction.user}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No transactions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TransactionsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-1" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <Skeleton className="h-[500px] w-full rounded-lg" />
    </div>
  )
}

function TransactionTypeBadge({ type }: { type: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        type === "IN"
          ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
          : "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200",
      )}
    >
      {type === "IN" ? "Stock In" : "Stock Out"}
    </Badge>
  )
}
