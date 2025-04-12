"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface WarehouseDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  warehouseName: string
}

export function WarehouseDeleteDialog({ open, onOpenChange, onConfirm, warehouseName }: WarehouseDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Delete Warehouse</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete the warehouse <span className="font-medium">{warehouseName}</span>? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Deleting this warehouse will remove all associated data, including inventory records and transaction
            history. Products stored in this warehouse will need to be relocated.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete Warehouse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
