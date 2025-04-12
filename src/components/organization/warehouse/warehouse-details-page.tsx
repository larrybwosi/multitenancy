"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Edit, Trash, BarChart2, Package } from "lucide-react"
import Link from "next/link"
import { WarehouseDeleteDialog } from "./warehouse-delete-dialog"
import { WarehouseEditSheet } from "./warehouse-edit-sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface WarehouseDetailsPageProps {
  id: string
}

export function WarehouseDetailsPage({ id }: WarehouseDetailsPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [warehouse, setWarehouse] = useState<any>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)

  useEffect(() => {
    async function fetchWarehouse() {
      try {
        setLoading(true)
        const response = await fetch(`/api/warehouse/${id}`)
        const data = await response.json()
        setWarehouse(data.warehouse)
      } catch (error) {
        console.error("Error fetching warehouse:", error)
        toast("Error",{
          description: "Failed to load warehouse details. Please try again.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchWarehouse()
  }, [id])

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/organization/warehouse/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete warehouse")

      toast("Warehouse deleted",{
        description: "The warehouse has been successfully deleted.",
      })

      router.push("/organization/warehouse")
    } catch (error) {
      console.error("Error deleting warehouse:", error)
      toast("Error",{
        description: "Failed to delete warehouse. Please try again.",
      })
    }
  }

  const handleUpdate = async (formData: any) => {
    try {
      const response = await fetch(`/api/warehouse/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to update warehouse")

      const updatedWarehouse = await response.json()
      setWarehouse(updatedWarehouse)

      toast( "Warehouse updated",{
        description: "The warehouse details have been successfully updated.",
      })

      return true
    } catch (error) {
      console.error("Error updating warehouse:", error)
      toast("Error",{
        description: "Failed to update warehouse. Please try again.",
      })
      return false
    }
  }

  if (loading) {
    return <WarehouseDetailsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/organization/warehouse">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{warehouse.name}</h1>
            <p className="text-muted-foreground">{warehouse.location}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/organization/warehouse/${id}/transactions`}>
              <BarChart2 className="mr-2 h-4 w-4" />
              Transactions
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setShowEditSheet(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Warehouse Details</CardTitle>
            <CardDescription>Detailed information about this warehouse.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Location</h3>
                <p>{warehouse.location}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Manager</h3>
                <p>{warehouse.manager}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                <StatusBadge status={warehouse.status} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Updated</h3>
                <p>{new Date(warehouse.lastUpdated).toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Address</h3>
                <p>{warehouse.address}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Contact</h3>
                <p>{warehouse.phone}</p>
                <p>{warehouse.email}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
              <p>{warehouse.description}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity</CardTitle>
            <CardDescription>Current storage utilization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Background circle */}
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={
                      warehouse.used / warehouse.capacity > 0.9
                        ? "#ef4444"
                        : warehouse.used / warehouse.capacity > 0.7
                          ? "#f59e0b"
                          : "#10b981"
                    }
                    strokeWidth="10"
                    strokeDasharray={`${(warehouse.used / warehouse.capacity) * 283} 283`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                  {/* Center icon */}
                  <foreignObject x="25" y="25" width="50" height="50">
                    <div className="flex items-center justify-center w-full h-full">
                      <Package className="h-10 w-10 text-gray-500" />
                    </div>
                  </foreignObject>
                </svg>
              </div>
              <div className="text-center mt-4">
                <p className="text-2xl font-bold">{Math.round((warehouse.used / warehouse.capacity) * 100)}%</p>
                <p className="text-sm text-muted-foreground">
                  {warehouse.used.toLocaleString()} / {warehouse.capacity.toLocaleString()} units
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Product Count</h3>
                <p className="text-xl font-bold">{warehouse.productCount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <WarehouseDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        warehouseName={warehouse.name}
      />

      <WarehouseEditSheet
        open={showEditSheet}
        onOpenChange={setShowEditSheet}
        warehouse={warehouse}
        onSave={handleUpdate}
      />
    </div>
  )
}

function WarehouseDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
    MAINTENANCE: "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200",
    INACTIVE: "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200",
  }

  const colorClass = statusColors[status] || "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"

  return (
    <Badge variant="outline" className={cn("font-medium", colorClass)}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  )
}
