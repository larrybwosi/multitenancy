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
import { toast } from "sonner"

interface AddUnitModalProps {
  warehouseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddUnitModal({ warehouseId, open, onOpenChange }: AddUnitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [unitName, setUnitName] = useState("")
  const [unitType, setUnitType] = useState("")
  const [unitZone, setUnitZone] = useState("")
  const [unitPositions, setUnitPositions] = useState("1")

  // Mock data for zones
  const zones = [
    { id: "1", name: "Zone A" },
    { id: "2", name: "Zone B" },
    { id: "3", name: "Zone C" },
    { id: "4", name: "Zone D" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.success("Storage unit added successfully", {
        description: `Unit "${unitName}" has been added to the warehouse.`,
        action: {
          label: "View",
          onClick: () => console.log("View unit"),
        },
      })

      // Reset form and close modal
      setUnitName("")
      setUnitType("")
      setUnitZone("")
      setUnitPositions("1")
      setIsSubmitting(false)
      onOpenChange(false)
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Storage Unit</DialogTitle>
            <DialogDescription>
              Create a new storage unit in this warehouse. Units are physical storage spaces within zones.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="e.g., Rack A1"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select value={unitType} onValueChange={setUnitType} required>
                <SelectTrigger id="type" className="col-span-3">
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RACK">Rack</SelectItem>
                  <SelectItem value="BIN">Bin</SelectItem>
                  <SelectItem value="SHELF">Shelf</SelectItem>
                  <SelectItem value="PALLET">Pallet</SelectItem>
                  <SelectItem value="BULK_AREA">Bulk Area</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="zone" className="text-right">
                Zone
              </Label>
              <Select value={unitZone} onValueChange={setUnitZone}>
                <SelectTrigger id="zone" className="col-span-3">
                  <SelectValue placeholder="Select zone (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="positions" className="text-right">
                Positions
              </Label>
              <Input
                id="positions"
                type="number"
                min="1"
                value={unitPositions}
                onChange={(e) => setUnitPositions(e.target.value)}
                className="col-span-3"
                required
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
                  Adding...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Add Unit
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
