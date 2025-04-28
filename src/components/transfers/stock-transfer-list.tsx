import { ExternalLink } from "lucide-react"
import Link from "next/link"

import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface StockTransferListProps {
  status?: "pending" | "completed" | "all"
}

export function StockTransferList({ status = "all" }: StockTransferListProps) {
  // Mock data for stock transfers
  const allTransfers = [
    {
      id: "1",
      referenceNumber: "TRF-001",
      fromWarehouse: "Main Warehouse",
      toWarehouse: "East Storage Facility",
      items: 12,
      quantity: 156,
      status: "completed",
      initiatedBy: "John Smith",
      date: "2023-04-15T10:30:00",
    },
    {
      id: "2",
      referenceNumber: "TRF-002",
      fromWarehouse: "West Distribution Center",
      toWarehouse: "Main Warehouse",
      items: 8,
      quantity: 94,
      status: "pending",
      initiatedBy: "Sarah Johnson",
      date: "2023-04-16T14:45:00",
    },
    {
      id: "3",
      referenceNumber: "TRF-003",
      fromWarehouse: "South Warehouse",
      toWarehouse: "Downtown Retail Store",
      items: 5,
      quantity: 42,
      status: "completed",
      initiatedBy: "Michael Brown",
      date: "2023-04-14T09:15:00",
    },
    {
      id: "4",
      referenceNumber: "TRF-004",
      fromWarehouse: "Main Warehouse",
      toWarehouse: "West Distribution Center",
      items: 15,
      quantity: 210,
      status: "pending",
      initiatedBy: "Emily Davis",
      date: "2023-04-17T11:20:00",
    },
    {
      id: "5",
      referenceNumber: "TRF-005",
      fromWarehouse: "East Storage Facility",
      toWarehouse: "South Warehouse",
      items: 7,
      quantity: 63,
      status: "completed",
      initiatedBy: "John Smith",
      date: "2023-04-13T16:20:00",
    },
  ]

  // Filter transfers by status if specified
  const transfers = status === "all" ? allTransfers : allTransfers.filter((transfer) => transfer.status === status)

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead className="hidden md:table-cell">From</TableHead>
              <TableHead className="hidden md:table-cell">To</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="hidden lg:table-cell">Initiated By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell className="font-medium">
                  <Link href={`/transfers/${transfer.id}`} className="flex items-center hover:underline">
                    {transfer.referenceNumber}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">{transfer.fromWarehouse}</TableCell>
                <TableCell className="hidden md:table-cell">{transfer.toWarehouse}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{transfer.items} items</span>
                    <span className="text-xs text-muted-foreground">{transfer.quantity} units</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{transfer.initiatedBy}</TableCell>
                <TableCell>{formatDate(transfer.date)}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      transfer.status === "completed"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
                    }`}
                  >
                    {transfer.status === "completed" ? "Completed" : "Pending"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
