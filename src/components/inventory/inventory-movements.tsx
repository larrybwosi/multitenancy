import { ArrowDownLeft, ArrowUpRight } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface InventoryMovementsProps {
  id: string
}

export function InventoryMovements({ id }: InventoryMovementsProps) {
  // Mock data for product movements
  const movements = [
    {
      id: "1",
      type: "TRANSFER",
      from: "Main Warehouse",
      to: "East Storage Facility",
      quantity: 50,
      date: "2023-04-15T10:30:00",
      reference: "TRF-001",
      initiatedBy: "John Smith",
    },
    {
      id: "2",
      type: "PURCHASE_RECEIPT",
      from: "Supplier",
      to: "Main Warehouse",
      quantity: 200,
      date: "2023-04-14T14:45:00",
      reference: "PO-1234",
      initiatedBy: "Sarah Johnson",
    },
    {
      id: "3",
      type: "SALE",
      from: "East Storage Facility",
      to: "Customer",
      quantity: 8,
      date: "2023-04-14T09:15:00",
      reference: "SO-5678",
      initiatedBy: "Michael Brown",
    },
    {
      id: "4",
      type: "ADJUSTMENT_IN",
      from: "Inventory Count",
      to: "Main Warehouse",
      quantity: 10,
      date: "2023-04-13T16:20:00",
      reference: "ADJ-001",
      initiatedBy: "Emily Davis",
    },
    {
      id: "5",
      type: "TRANSFER",
      from: "East Storage Facility",
      to: "South Warehouse",
      quantity: 25,
      date: "2023-04-12T11:10:00",
      reference: "TRF-002",
      initiatedBy: "John Smith",
    },
  ]

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
      <CardHeader>
        <CardTitle>Movement History</CardTitle>
        <CardDescription>Recent stock movements for this product</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">From</TableHead>
              <TableHead className="hidden md:table-cell">To</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="hidden lg:table-cell">Reference</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {movement.type === "PURCHASE_RECEIPT" || movement.type === "ADJUSTMENT_IN" ? (
                      <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-rose-500" />
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        movement.type === "PURCHASE_RECEIPT" || movement.type === "ADJUSTMENT_IN"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500"
                          : movement.type === "SALE"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-500"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500"
                      }`}
                    >
                      {movement.type === "PURCHASE_RECEIPT"
                        ? "Receipt"
                        : movement.type === "SALE"
                          ? "Sale"
                          : movement.type === "TRANSFER"
                            ? "Transfer"
                            : "Adjustment"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{movement.from}</TableCell>
                <TableCell className="hidden md:table-cell">{movement.to}</TableCell>
                <TableCell>{movement.quantity}</TableCell>
                <TableCell className="hidden lg:table-cell">{movement.reference}</TableCell>
                <TableCell>{formatDate(movement.date)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
