"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, XCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface StockAdjustment {
  id: string
  date: string
  warehouseId: string
  warehouseName: string
  productId: string
  productName: string
  adjustmentType: "increase" | "decrease"
  quantity: number
  reason: string
  status: "completed" | "pending" | "cancelled"
  createdBy: string
}

interface StockAdjustmentsListProps {
  adjustments: StockAdjustment[]
}

export function StockAdjustmentsList({ adjustments = [] }: StockAdjustmentsListProps) {
  const [selectedAdjustment, setSelectedAdjustment] = useState<StockAdjustment | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  // Mock data for preview
  const mockAdjustments: StockAdjustment[] = [
    {
      id: "adj-001",
      date: "2023-04-15T10:30:00Z",
      warehouseId: "wh-001",
      warehouseName: "Main Warehouse",
      productId: "prod-001",
      productName: "Ergonomic Chair",
      adjustmentType: "increase",
      quantity: 15,
      reason: "Inventory count correction",
      status: "completed",
      createdBy: "John Doe",
    },
    {
      id: "adj-002",
      date: "2023-04-14T14:45:00Z",
      warehouseId: "wh-002",
      warehouseName: "East Warehouse",
      productId: "prod-002",
      productName: "Standing Desk",
      adjustmentType: "decrease",
      quantity: 5,
      reason: "Damaged inventory",
      status: "completed",
      createdBy: "Jane Smith",
    },
    {
      id: "adj-003",
      date: "2023-04-13T09:15:00Z",
      warehouseId: "wh-001",
      warehouseName: "Main Warehouse",
      productId: "prod-003",
      productName: "Monitor Stand",
      adjustmentType: "increase",
      quantity: 25,
      reason: "Found additional stock",
      status: "pending",
      createdBy: "Mike Johnson",
    },
    {
      id: "adj-004",
      date: "2023-04-12T16:20:00Z",
      warehouseId: "wh-003",
      warehouseName: "West Warehouse",
      productId: "prod-004",
      productName: "Keyboard",
      adjustmentType: "decrease",
      quantity: 10,
      reason: "Quality control rejection",
      status: "cancelled",
      createdBy: "Sarah Williams",
    },
  ]

  const displayAdjustments = adjustments.length > 0 ? adjustments : mockAdjustments

  const viewDetails = (adjustment: StockAdjustment) => {
    setSelectedAdjustment(adjustment)
    setDetailsOpen(true)
  }

  const openCancelDialog = (adjustment: StockAdjustment) => {
    setSelectedAdjustment(adjustment)
    setCancelDialogOpen(true)
  }

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayAdjustments.map((adjustment) => (
            <TableRow key={adjustment.id}>
              <TableCell className="font-medium">{adjustment.id}</TableCell>
              <TableCell>{formatDate(adjustment.date)}</TableCell>
              <TableCell>{adjustment.warehouseName}</TableCell>
              <TableCell>{adjustment.productName}</TableCell>
              <TableCell>
                <Badge variant={adjustment.adjustmentType === "increase" ? "success" : "destructive"}>
                  {adjustment.adjustmentType === "increase" ? "Increase" : "Decrease"}
                </Badge>
              </TableCell>
              <TableCell>{adjustment.quantity}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    adjustment.status === "completed"
                      ? "outline"
                      : adjustment.status === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {adjustment.status.charAt(0).toUpperCase() + adjustment.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>{adjustment.createdBy}</TableCell>
              <TableCell className="text-right">
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
                    <DropdownMenuItem onClick={() => viewDetails(adjustment)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {adjustment.status === "pending" && (
                      <DropdownMenuItem
                        onClick={() => openCancelDialog(adjustment)}
                        className="text-destructive focus:text-destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Adjustment
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* We would add the details dialog and cancel dialog components here */}
      {/* For now, they're omitted to focus on fixing the immediate error */}
    </div>
  )
}
