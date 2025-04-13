"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { XCircle } from "lucide-react"

export function CancelTransferDialog({ open, onOpenChange, onConfirm }) {
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return
    }

    setIsSubmitting(true)
    await onConfirm(reason)
    setIsSubmitting(false)
    setReason("")
  }

  const handleCancel = () => {
    setReason("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Cancel Stock Transfer
          </DialogTitle>
          <DialogDescription>Please provide a reason for cancelling this stock transfer.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for cancellation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px] transition-all border-muted hover:border-muted-foreground/50 focus:border-primary"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="transition-all border-muted hover:border-muted-foreground/50 focus:border-primary"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isSubmitting}
            className="transition-all"
          >
            {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
