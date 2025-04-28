import { ExternalLink, MoreHorizontal, Pencil, Truck } from "lucide-react"
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

interface InventoryListProps {
  stockStatus?: "all" | "low" | "critical"
}

export function InventoryList({ stockStatus = "all" }: InventoryListProps) {
  // Mock data for inventory
  const allInventory = [
    {
      id: "1",
      name: "Smartphone X1",
      sku: "SP-X1-001",
      category: "Electronics",
      stock: 342,
      reorderPoint: 50,
      status: "In Stock",
      warehouses: [
        { name: "Main Warehouse", stock: 200 },
        { name: "East Storage Facility", stock: 142 },
      ],
    },
    {
      id: "2",
      name: "Wireless Headphones",
      sku: "WH-BT-002",
      category: "Electronics",
      stock: 128,
      reorderPoint: 30,
      status: "In Stock",
      warehouses: [
        { name: "Main Warehouse", stock: 78 },
        { name: "West Distribution Center", stock: 50 },
      ],
    },
    {
      id: "3",
      name: "Laptop Pro 15",
      sku: "LP-15-003",
      category: "Electronics",
      stock: 24,
      reorderPoint: 20,
      status: "Low Stock",
      warehouses: [
        { name: "Main Warehouse", stock: 14 },
        { name: "South Warehouse", stock: 10 },
      ],
    },
    {
      id: "4",
      name: "Smart Watch Series 5",
      sku: "SW-S5-004",
      category: "Wearables",
      stock: 8,
      reorderPoint: 15,
      status: "Critical",
      warehouses: [
        { name: "Main Warehouse", stock: 5 },
        { name: "Downtown Retail Store", stock: 3 },
      ],
    },
    {
      id: "5",
      name: "Bluetooth Speaker",
      sku: "BS-JBL-005",
      category: "Audio",
      stock: 56,
      reorderPoint: 20,
      status: "In Stock",
      warehouses: [
        { name: "Main Warehouse", stock: 36 },
        { name: "East Storage Facility", stock: 20 },
      ],
    },
    {
      id: "6",
      name: "Tablet Pro 10",
      sku: "TP-10-006",
      category: "Electronics",
      stock: 18,
      reorderPoint: 25,
      status: "Low Stock",
      warehouses: [
        { name: "Main Warehouse", stock: 10 },
        { name: "West Distribution Center", stock: 8 },
      ],
    },
    {
      id: "7",
      name: "Wireless Charger",
      sku: "WC-QI-007",
      category: "Accessories",
      stock: 5,
      reorderPoint: 15,
      status: "Critical",
      warehouses: [
        { name: "Main Warehouse", stock: 3 },
        { name: "Downtown Retail Store", stock: 2 },
      ],
    },
  ]

  // Filter inventory by stock status if specified
  const inventory =
    stockStatus === "all"
      ? allInventory
      : stockStatus === "low"
        ? allInventory.filter((item) => item.status === "Low Stock")
        : allInventory.filter((item) => item.status === "Critical")

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="hidden md:table-cell">SKU</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="hidden md:table-cell">Warehouses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <Link href={`/inventory/${item.id}`} className="flex items-center hover:underline">
                    {item.name}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">{item.sku}</TableCell>
                <TableCell className="hidden lg:table-cell">{item.category}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <span className="tabular-nums">{item.stock}</span>
                    <span className="ml-2 text-xs text-muted-foreground">/ {item.reorderPoint} min</span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-col gap-1 text-xs">
                    {item.warehouses.map((warehouse, index) => (
                      <div key={index}>
                        {warehouse.name}: <span className="font-medium">{warehouse.stock}</span>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      item.status === "In Stock"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500"
                        : item.status === "Low Stock"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
                          : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-500"
                    }`}
                  >
                    {item.status}
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
                        <Link href={`/inventory/${item.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/inventory/${item.id}/edit`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/transfers/new?product=${item.id}`}>
                          <Truck className="mr-2 h-4 w-4" />
                          Transfer Stock
                        </Link>
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
