"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Truck, CheckCircle, XCircle, Clock, User, CalendarClock, FileText, Package, ArrowRight } from "lucide-react"

export function StockTransferDetailsDialog({ open, onOpenChange, transfer }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        )
      case "in_transit":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
            <Truck className="h-3 w-3" />
            <span>In Transit</span>
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Completed</span>
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>Cancelled</span>
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            Stock Transfer Details
            {getStatusBadge(transfer.status)}
          </DialogTitle>
          <DialogDescription>
            Transfer ID: <span className="font-mono">{transfer.id}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="details"
              className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="items"
              className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Items
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Warehouses
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{transfer.sourceWarehouse}</p>
                      <p className="text-sm text-muted-foreground">Source</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{transfer.destinationWarehouse}</p>
                      <p className="text-sm text-muted-foreground">Destination</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Created By
                  </h3>
                  <p>{transfer.createdBy}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(transfer.createdAt || transfer.date)}</p>
                </div>

                {transfer.status === "in_transit" && (
                  <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      In Transit Details
                    </h3>
                    <p>Marked by: {transfer.inTransitBy || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(transfer.inTransitAt || "N/A")}</p>
                    {transfer.estimatedArrival && (
                      <div>
                        <p className="text-sm font-medium">Estimated Arrival</p>
                        <p className="text-sm text-muted-foreground">{formatDate(transfer.estimatedArrival)}</p>
                      </div>
                    )}
                    {transfer.trackingInfo && (
                      <div>
                        <p className="text-sm font-medium">Tracking Info</p>
                        <p className="text-sm font-mono">{transfer.trackingInfo}</p>
                      </div>
                    )}
                  </div>
                )}

                {transfer.status === "completed" && (
                  <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Completion Details
                    </h3>
                    <p>Completed by: {transfer.completedBy || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(transfer.completedAt || "N/A")}</p>
                  </div>
                )}

                {transfer.status === "cancelled" && (
                  <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Cancellation Details
                    </h3>
                    <p>Cancelled by: {transfer.cancelledBy || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(transfer.cancelledAt || "N/A")}</p>
                    {transfer.cancellationReason && (
                      <div>
                        <p className="text-sm font-medium">Reason</p>
                        <p className="text-sm text-muted-foreground">{transfer.cancellationReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <CalendarClock className="h-4 w-4" />
                    Dates
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">{formatDate(transfer.createdAt || transfer.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">{formatDate(transfer.updatedAt || transfer.date)}</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Notes
                  </h3>
                  <p className="text-sm">{transfer.notes || "No notes provided"}</p>
                </div>

                <div className="border rounded-lg p-4 space-y-2 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
                  <h3 className="text-sm font-medium text-muted-foreground">Summary</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm font-medium">Total Items</p>
                      <p>{transfer.totalItems || transfer.items.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Total Quantity</p>
                      <p>
                        {transfer.totalQuantity || transfer.items.reduce((sum, item) => sum + item.quantity, 0)} units
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium">Total Value</p>
                      <p className="font-medium">
                        {formatCurrency(
                          transfer.totalValue ||
                            transfer.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="items" className="mt-4">
            <div className="border rounded-lg overflow-hidden transition-all hover:border-muted-foreground/20 hover:shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/70 transition-colors">
                    <TableHead className="font-medium">Product</TableHead>
                    <TableHead className="font-medium">SKU</TableHead>
                    <TableHead className="font-medium text-right">Quantity</TableHead>
                    <TableHead className="font-medium text-right">Unit Cost</TableHead>
                    <TableHead className="font-medium text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfer.items.map((item) => (
                    <TableRow key={item.productId} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.image && (
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.productName}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          <span>{item.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{item.sku}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitCost)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.quantity * item.unitCost)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={3}></TableCell>
                    <TableCell className="font-medium text-right">Total Value</TableCell>
                    <TableCell className="font-medium text-right">
                      {formatCurrency(
                        transfer.totalValue ||
                          transfer.items.reduce((total, item) => total + item.quantity * item.unitCost, 0),
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="border rounded-lg p-4 space-y-4 transition-all hover:border-muted-foreground/20 hover:shadow-sm">
              <h3 className="text-sm font-medium">Transfer Timeline</h3>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="w-0.5 h-full bg-muted-foreground/20 mt-2"></div>
                  </div>
                  <div>
                    <p className="font-medium">Transfer Created</p>
                    <p className="text-sm text-muted-foreground">{formatDate(transfer.createdAt || transfer.date)}</p>
                    <p className="text-sm">Created by {transfer.createdBy}</p>
                  </div>
                </div>

                {transfer.status !== "pending" && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div className="w-0.5 h-full bg-muted-foreground/20 mt-2"></div>
                    </div>
                    <div>
                      <p className="font-medium">Marked as In Transit</p>
                      <p className="text-sm text-muted-foreground">{formatDate(transfer.inTransitAt || "N/A")}</p>
                      <p className="text-sm">By {transfer.inTransitBy || "N/A"}</p>
                    </div>
                  </div>
                )}

                {transfer.status === "completed" && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                        <CheckCircle className="h-4 w-4" />
                      </div>
                      <div className="w-0.5 h-full bg-muted-foreground/20 mt-2"></div>
                    </div>
                    <div>
                      <p className="font-medium">Transfer Completed</p>
                      <p className="text-sm text-muted-foreground">{formatDate(transfer.completedAt || "N/A")}</p>
                      <p className="text-sm">By {transfer.completedBy || "N/A"}</p>
                    </div>
                  </div>
                )}

                {transfer.status === "cancelled" && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-700">
                        <XCircle className="h-4 w-4" />
                      </div>
                      <div className="w-0.5 h-0 bg-muted-foreground/20 mt-2"></div>
                    </div>
                    <div>
                      <p className="font-medium">Transfer Cancelled</p>
                      <p className="text-sm text-muted-foreground">{formatDate(transfer.cancelledAt || "N/A")}</p>
                      <p className="text-sm">By {transfer.cancelledBy || "N/A"}</p>
                      {transfer.cancellationReason && (
                        <p className="text-sm mt-1 text-muted-foreground">Reason: {transfer.cancellationReason}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
