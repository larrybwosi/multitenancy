"use client"

import { useState } from "react"
import { Printer, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { formatCurrency } from "@/lib/utils"

export function OrderDetails({ order, onDelete, onUpdateStatus }) {
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)

  const handleGenerateInvoice = () => {
    setIsGeneratingInvoice(true)
    // Simulate API call
    setTimeout(() => {
      setIsGeneratingInvoice(false)
      window.open(`/api/invoice/${order.id}`, "_blank")
    }, 1000)
  }

  const getStatusBadgeVariant = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "success"
      case "pending":
        return "outline"
      case "in progress":
        return "warning"
      case "ready to serve":
        return "default"
      case "canceled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getNextStatus = (currentStatus) => {
    switch (currentStatus.toLowerCase()) {
      case "pending":
        return "In Progress"
      case "in progress":
        return "Ready to Serve"
      case "ready to serve":
        return "Completed"
      default:
        return null
    }
  }

  const nextStatus = getNextStatus(order.status)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Order Details</CardTitle>
        <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Order Number</div>
          <div className="font-medium">#{order.orderNumber}</div>
        </div>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Customer</div>
          <div className="font-medium">{order.customerName}</div>
        </div>

        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Date</div>
          <div className="font-medium">{order.date}</div>
        </div>

        <Separator />

        <div>
          <div className="text-sm font-medium mb-2">Items</div>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <span className="font-medium">{item.quantity}x</span> {item.name}
                </div>
                <div>{formatCurrency(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>{formatCurrency(order.total * 0.1)}</span>
          </div>
          <div className="flex justify-between font-medium pt-2">
            <span>Total</span>
            <span>{formatCurrency(order.total * 1.1)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleGenerateInvoice} disabled={isGeneratingInvoice}>
            <Printer className="mr-2 h-4 w-4" />
            {isGeneratingInvoice ? "Generating..." : "Invoice"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete order #{order.orderNumber}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(order.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {nextStatus && (
          <Button onClick={() => onUpdateStatus(order.id, nextStatus)}>
            <Check className="mr-2 h-4 w-4" />
            Mark as {nextStatus}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
