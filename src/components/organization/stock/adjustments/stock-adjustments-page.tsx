"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Filter } from "lucide-react"
import { StockAdjustmentsList } from "./stock-adjustments-list"
import { CreateStockAdjustmentSheet } from "./create-stock-adjustment-sheet"

export function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(false)
  const [createSheetOpen, setCreateSheetOpen] = useState(false)

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Adjustments</h1>
        <p className="text-muted-foreground">Manage and track inventory adjustments across warehouses</p>
      </div>

      <div className="flex justify-between items-center">
        <div/>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setCreateSheetOpen(true)} className="transition-all hover:bg-primary/90">
            Create Adjustment
          </Button>
        </div>
      </div>

      <Card className="border-muted transition-all hover:border-muted-foreground/20">
        <CardHeader>
          <CardTitle>Inventory Adjustments</CardTitle>
          <CardDescription>View and manage all inventory adjustments</CardDescription>
        </CardHeader>
        <CardContent>
          <StockAdjustmentsList adjustments={adjustments} />
        </CardContent>
      </Card>

      <CreateStockAdjustmentSheet open={createSheetOpen} onOpenChange={setCreateSheetOpen} />
    </div>
  )
}
