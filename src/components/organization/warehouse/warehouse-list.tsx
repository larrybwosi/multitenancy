"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, Search, Trash, Eye, BarChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { InventoryLocation } from "@prisma/client"
import { AlertTriangle } from "lucide-react"

interface WarehouseListProps {
  warehouses: InventoryLocation[]
  loading: boolean
  error?: Error | null
}

export function WarehouseList({ warehouses, loading, error }: WarehouseListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredWarehouses = warehouses?.filter((warehouse) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      warehouse.name.toLowerCase().includes(searchLower) ||
      (warehouse.address?.toLowerCase().includes(searchLower) || false)
    )
  })

  if (error) {
    return (
      <div className="border rounded-md p-4 flex flex-col items-center justify-center gap-4 h-64">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <div className="text-center">
          <h3 className="font-medium">Failed to load warehouses</h3>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search warehouses..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-6 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredWarehouses?.length > 0 ? (
              filteredWarehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">
                    <Link href={`/warehouses/${warehouse.id}`} className="hover:underline">
                      {warehouse.name}
                    </Link>
                  </TableCell>
                  <TableCell>{warehouse.address || '-'}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{warehouse.capacityUsed?.toLocaleString() || '0'}</span>
                        <span>{warehouse.totalCapacity?.toLocaleString() || '0'}</span>
                      </div>
                      {warehouse.totalCapacity && warehouse.capacityUsed && (
                        <Progress
                          value={(warehouse.capacityUsed / warehouse.totalCapacity) * 100}
                          className="h-2"
                          indicatorClassName={cn(
                            warehouse.capacityUsed / warehouse.totalCapacity > 0.9
                              ? "bg-red-500"
                              : warehouse.capacityUsed / warehouse.totalCapacity > 0.7
                                ? "bg-amber-500"
                                : "bg-green-500",
                          )}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge isActive={warehouse.isActive} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(warehouse.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/warehouses/${warehouse.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View Details</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/warehouses/${warehouse.id}/transactions`}>
                            <BarChart className="mr-2 h-4 w-4" />
                            <span>View Transactions</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No warehouses found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  const status = isActive ? 'ACTIVE' : 'INACTIVE'
  const statusColors = {
    ACTIVE: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
    INACTIVE: "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200",
  }

  return (
    <Badge variant="outline" className={cn("font-medium", statusColors[status])}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  )
}