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
import { Badge } from "@/components/ui/badge"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Eye, Truck, CheckCircle, XCircle, MoreHorizontal } from "lucide-react"
import { StockTransferDetailsDialog } from "./stock-transfer-details-dialog"
import { CancelTransferDialog } from "./cancel-transfer-dialog"

export function StockTransfersList({ transfers, onUpdateTransfer }) {
  const [selectedTransfer, setSelectedTransfer] = useState(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 transition-colors flex items-center gap-1"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-500"></span>
            <span>Pending</span>
          </Badge>
        )
      case "in_transit":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            <span>In Transit</span>
          </Badge>
        )
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors flex items-center gap-1"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
            <span>Completed</span>
          </Badge>
        )
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
            <span>Cancelled</span>
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleViewDetails = (transfer) => {
    setSelectedTransfer(transfer)
    setDetailsOpen(true)
  }

  const handleCancelTransfer = (transfer) => {
    setSelectedTransfer(transfer)
    setCancelDialogOpen(true)
  }

  const handleConfirmCancel = async (reason) => {
    const success = await onUpdateTransfer(selectedTransfer.id, "cancel", { cancellationReason: reason })
    if (success) {
      setCancelDialogOpen(false)
    }
  }

  const handleMarkInTransit = async (transfer) => {
    await onUpdateTransfer(transfer.id, "mark_in_transit")
  }

  const handleMarkCompleted = async (transfer) => {
    await onUpdateTransfer(transfer.id, "mark_completed")
  }

  return (
    <div>
      <div className="rounded-md border border-muted overflow-hidden transition-all hover:border-muted-foreground/20">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/70 transition-colors">
              <TableHead className="font-medium">ID</TableHead>
              <TableHead className="font-medium">Date</TableHead>
              <TableHead className="font-medium">Source</TableHead>
              <TableHead className="font-medium">Destination</TableHead>
              <TableHead className="font-medium">Items</TableHead>
              <TableHead className="font-medium">Value</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No stock transfers found
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((transfer) => (
                <TableRow key={transfer.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs">{transfer.id}</TableCell>
                  <TableCell>{formatDate(transfer.date)}</TableCell>
                  <TableCell>{transfer.sourceWarehouse}</TableCell>
                  <TableCell>{transfer.destinationWarehouse}</TableCell>
                  <TableCell>{transfer.items.length} items</TableCell>
                  <TableCell>{formatCurrency(transfer.totalValue || 0)}</TableCell>
                  <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleViewDetails(transfer)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {transfer.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => handleMarkInTransit(transfer)}>
                              <Truck className="mr-2 h-4 w-4" />
                              Mark as In Transit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCancelTransfer(transfer)}>
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancel Transfer
                            </DropdownMenuItem>
                          </>
                        )}
                        {transfer.status === "in_transit" && (
                          <DropdownMenuItem onClick={() => handleMarkCompleted(transfer)}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Completed
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedTransfer && (
        <>
          <StockTransferDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} transfer={selectedTransfer} />
          <CancelTransferDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            onConfirm={handleConfirmCancel}
          />
        </>
      )}
    </div>
  )
}
