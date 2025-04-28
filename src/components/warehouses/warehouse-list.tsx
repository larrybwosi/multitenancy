import { Building2, ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface WarehouseListProps {
  type?: "RETAIL_SHOP" | "WAREHOUSE" | "DISTRIBUTION" | "OTHER"
}

export function WarehouseList({ type }: WarehouseListProps) {
  // Mock data for warehouses
  const allWarehouses = [
    {
      id: "1",
      name: "Main Warehouse",
      description: "Primary storage facility",
      location: "New York",
      type: "WAREHOUSE",
      capacity: 75,
      products: 3245,
      zones: 12,
      units: 156,
      status: "Active",
    },
    {
      id: "2",
      name: "West Distribution Center",
      description: "Distribution center for west region",
      location: "Los Angeles",
      type: "DISTRIBUTION",
      capacity: 62,
      products: 2876,
      zones: 8,
      units: 124,
      status: "Active",
    },
    {
      id: "3",
      name: "South Warehouse",
      description: "Storage for southern region",
      location: "Miami",
      type: "WAREHOUSE",
      capacity: 48,
      products: 1987,
      zones: 6,
      units: 98,
      status: "Active",
    },
    {
      id: "4",
      name: "East Storage Facility",
      description: "Storage and distribution for east coast",
      location: "Boston",
      type: "WAREHOUSE",
      capacity: 89,
      products: 4435,
      zones: 14,
      units: 210,
      status: "Active",
    },
    {
      id: "5",
      name: "Downtown Retail Store",
      description: "Main retail location",
      location: "Chicago",
      type: "RETAIL_SHOP",
      capacity: 35,
      products: 876,
      zones: 3,
      units: 42,
      status: "Active",
    },
    {
      id: "6",
      name: "North Distribution Hub",
      description: "Distribution center for northern region",
      location: "Seattle",
      type: "DISTRIBUTION",
      capacity: 58,
      products: 2145,
      zones: 7,
      units: 112,
      status: "Inactive",
    },
  ]

  // Filter warehouses by type if specified
  const warehouses = type ? allWarehouses.filter((warehouse) => warehouse.type === type) : allWarehouses

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="hidden md:table-cell">Products</TableHead>
              <TableHead className="hidden lg:table-cell">Zones</TableHead>
              <TableHead className="hidden lg:table-cell">Units</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((warehouse) => (
              <TableRow key={warehouse.id}>
                <TableCell className="font-medium">
                  <Link href={`/warehouses/${warehouse.id}`} className="flex items-center hover:underline">
                    {warehouse.name}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                  <span className="text-xs text-muted-foreground">{warehouse.location}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      warehouse.type === "WAREHOUSE"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500"
                        : warehouse.type === "RETAIL_SHOP"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
                    }`}
                  >
                    {warehouse.type === "WAREHOUSE"
                      ? "Warehouse"
                      : warehouse.type === "RETAIL_SHOP"
                        ? "Retail"
                        : "Distribution"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex w-full items-center gap-2">
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full ${
                          warehouse.capacity > 80
                            ? "bg-rose-500"
                            : warehouse.capacity > 60
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${warehouse.capacity}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums">{warehouse.capacity}%</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{warehouse.products.toLocaleString()}</TableCell>
                <TableCell className="hidden lg:table-cell">{warehouse.zones}</TableCell>
                <TableCell className="hidden lg:table-cell">{warehouse.units}</TableCell>
                <TableCell className="text-right">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      warehouse.status === "Active"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-500"
                    }`}
                  >
                    {warehouse.status}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/warehouses/${warehouse.id}`}>
                          <Building2 className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/warehouses/${warehouse.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-rose-500 focus:text-rose-500">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
