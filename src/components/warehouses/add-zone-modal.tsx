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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ColorPicker } from "@/components/ui/color-picker"

interface AddZoneModalProps {
  warehouseId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddZoneModal({ warehouseId, open, onOpenChange }: AddZoneModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [zoneName, setZoneName] = useState("")
  const [zoneDescription, setZoneDescription] = useState("")
  const [zoneColor, setZoneColor] = useState("#3b82f6")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast.success("Zone added successfully", {
        description: `Zone "${zoneName}" has been added to the warehouse.`,
        action: {
          label: "View",
          onClick: () => console.log("View zone"),
        },
      })

      // Reset form and close modal
      setZoneName("")
      setZoneDescription("")
      setZoneColor("#3b82f6")
      setIsSubmitting(false)
      onOpenChange(false)
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Zone</DialogTitle>
            <DialogDescription>
              Create a new storage zone in this warehouse. Zones help organize your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g., Zone A"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={zoneDescription}
                onChange={(e) => setZoneDescription(e.target.value)}
                placeholder="e.g., Electronics section"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Color
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <ColorPicker color={zoneColor} onChange={setZoneColor} />
                <div className="h-6 w-6 rounded-md border" style={{ backgroundColor: zoneColor }} />
                <span className="text-sm text-muted-foreground">{zoneColor}</span>
              </div>
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
                  Add Zone
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
