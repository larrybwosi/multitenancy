"use client"

import type React from "react"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"

interface RequestStockMovementModalProps {
  warehouseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RequestStockMovementModal({ warehouseId, open, onOpenChange }: RequestStockMovementModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [movementType, setMovementType] = useState("inbound")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [selectedWarehouse, setSelectedWarehouse] = useState("")
  const [notes, setNotes] = useState("")

  // Mock data for products
  const products = [
    { id: "1", name: "Smartphone X1", sku: "SP-X1-001" },
    { id: "2", name: "Wireless Headphones", sku: "WH-BT-002" },
    { id: "3", name: "Laptop Pro 15", sku: "LP-15-003" },
    { id: "4", name: "Smart Watch Series 5", sku: "SW-S5-004" },
    { id: "5", name: "Bluetooth Speaker", sku: "BS-JBL-005" },
  ]

  // Mock data for warehouses
  const warehouses = [
    { id: "1", name: "Main Warehouse" },
    { id: "2", name: "West Distribution Center" },
    { id: "3", name: "South Warehouse" },
    { id: "4", name: "East Storage Facility" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.success("Stock movement requested", {
        description: `Your ${movementType} request has been submitted successfully.`,
        action: {
          label: "View",
          onClick: () => console.log("View movement"),
        },
      })

      // Reset form and close modal
      setMovementType("inbound")
      setSelectedProduct("")
      setQuantity("1")
      setSelectedWarehouse("")
      setNotes("")
      setIsSubmitting(false)
      onOpenChange(false)
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request Stock Movement</DialogTitle>
            <DialogDescription>Create a request to move stock in or out of this warehouse.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Movement Type</Label>
              <RadioGroup value={movementType} onValueChange={setMovementType} className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inbound" id="inbound" />
                  <Label htmlFor="inbound">Inbound (Receive)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="outbound" id="outbound" />
                  <Label htmlFor="outbound">Outbound (Send)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="product" className="text-right">
                Product
              </Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct} required>
                <SelectTrigger id="product" className="col-span-3">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="warehouse" className="text-right">
                {movementType === "inbound" ? "From" : "To"} Warehouse
              </Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse} required>
                <SelectTrigger id="warehouse" className="col-span-3">
                  <SelectValue
                    placeholder={`Select ${movementType === "inbound" ? "source" : "destination"} warehouse`}
                  />
                </SelectTrigger>
                <SelectContent>
                  {warehouses
                    .filter((w) => w.id !== warehouseId) // Filter out current warehouse
                    .map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional information about this movement"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
