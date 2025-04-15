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

interface WarehouseListProps {
  warehouses: any[]
  loading: boolean
}

export function WarehouseList({ warehouses, loading }: WarehouseListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      warehouse.manager.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
              <TableHead>Manager</TableHead>
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
            ) : filteredWarehouses.length > 0 ? (
              filteredWarehouses.map((warehouse) => (
                <TableRow key={warehouse.id}>
                  <TableCell className="font-medium">
                    <Link href={`/warehouses/${warehouse.id}`} className="hover:underline">
                      {warehouse.name}
                    </Link>
                  </TableCell>
                  <TableCell>{warehouse.location}</TableCell>
                  <TableCell>{warehouse.manager}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{warehouse.used.toLocaleString()}</span>
                        <span>{warehouse.capacity.toLocaleString()}</span>
                      </div>
                      <Progress
                        value={(warehouse.used / warehouse.capacity) * 100}
                        className="h-2"
                        indicatorClassName={cn(
                          warehouse.used / warehouse.capacity > 0.9
                            ? "bg-red-500"
                            : warehouse.used / warehouse.capacity > 0.7
                              ? "bg-amber-500"
                              : "bg-green-500",
                        )}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={warehouse.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(warehouse.lastUpdated).toLocaleDateString()}
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
                <TableCell colSpan={7} className="h-24 text-center">
                  No warehouses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
    MAINTENANCE: "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200",
    INACTIVE: "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200",
  }

  const colorClass = statusColors[status] || "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"

  return (
    <Badge variant="outline" className={cn("font-medium", colorClass)}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  )
}
