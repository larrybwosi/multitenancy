import { ArrowLeft, Check, Truck } from "lucide-react"
import Link from "next/link"

import { TransferDetails } from "@/components/transfers/transfer-details"
import { TransferItems } from "@/components/transfers/transfer-items"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TransferDetailsPage({
  params,
}: {
  params: { id: string }
}) {
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/transfers">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transfer {transfer.referenceNumber}</h1>
            <p className="text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Truck className="h-4 w-4" />
                {transfer.fromWarehouse} → {transfer.toWarehouse}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {transfer.status === "pending" && (
            <Button>
              <Check className="mr-2 h-4 w-4" />
              Complete Transfer
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Transfer Items</CardTitle>
            <CardDescription>Items included in this transfer</CardDescription>
          </CardHeader>
          <CardContent>
            <TransferItems id={params.id} />
          </CardContent>
        </Card>

        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>Information about this transfer</CardDescription>
          </CardHeader>
          <CardContent>
            <TransferDetails id={params.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
