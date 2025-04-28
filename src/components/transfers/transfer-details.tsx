import { Calendar, Clock, FileText, User } from "lucide-react"

interface TransferDetailsProps {
  id: string
}

export function TransferDetails({ id }: TransferDetailsProps) {
  // Mock data for transfer details
  const transfer = {
    id: "1",
    referenceNumber: "TRF-001",
    fromWarehouse: "Main Warehouse",
    toWarehouse: "East Storage Facility",
    items: 12,
    quantity: 156,
    status: "pending",
    initiatedBy: "John Smith",
    date: "2023-04-15T10:30:00",
    notes: "Regular stock rotation between warehouses. Priority items marked for expedited processing.",
  }

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  // Function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            transfer.status === "completed"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500"
              : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
          }`}
        >
          {transfer.status === "completed" ? "Completed" : "Pending"}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">Date</div>
            <div className="text-muted-foreground">{formatDate(transfer.date)}</div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">Time</div>
            <div className="text-muted-foreground">{formatTime(transfer.date)}</div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">Initiated By</div>
            <div className="text-muted-foreground">{transfer.initiatedBy}</div>
          </div>
        </div>

        {transfer.notes && (
          <div className="flex items-start gap-2 text-sm">
            <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-medium">Notes</div>
              <div className="text-muted-foreground">{transfer.notes}</div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 pt-4">
        <h3 className="text-sm font-medium">Summary</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">Total Items:</div>
          <div className="text-right font-medium">{transfer.items}</div>
          <div className="text-muted-foreground">Total Quantity:</div>
          <div className="text-right font-medium">{transfer.quantity}</div>
        </div>
      </div>
    </div>
  )
}
