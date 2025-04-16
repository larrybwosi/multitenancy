"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Edit,
  Trash,
  BarChart2,
  Package,
  Warehouse,
  MapPin,
  User,
  Calendar,
  Info,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { WarehouseDeleteDialog } from "./warehouse-delete-dialog";
import { WarehouseEditSheet } from "./warehouse-edit-sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { InventoryLocation } from "@prisma/client";
import useSWR from "swr";

interface WarehouseDetailsPageProps {
  id: string;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch warehouse");
    return res.json();
  });

export function WarehouseDetailsPage({ id }: WarehouseDetailsPageProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{
    warehouse: InventoryLocation;
  }>(`/api/warehouse/${id}`, fetcher, {
    onError: (err) => {
      toast.error("Error", {
        description: err.message || "Failed to load warehouse details",
      });
    },
  });

  const warehouse = data?.warehouse;

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/inventory-locations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete warehouse");

      toast.success("Success", {
        description: "Warehouse deleted successfully",
      });

      router.push("/inventory-locations");
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to delete warehouse",
      });
    }
  };

  const handleUpdate = async (formData: Partial<InventoryLocation>) => {
    try {
      const response = await fetch(`/api/inventory-locations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update warehouse");

      const updatedData = await response.json();
      mutate(updatedData, false);

      toast.success("Success", {
        description: "Warehouse updated successfully",
      });

      return true;
    } catch (error) {
      console.error("Error updating warehouse:", error);
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to update warehouse",
      });
      return false;
    }
  };

  if (isLoading) return <WarehouseDetailsSkeleton />;
  if (error || !warehouse) return <WarehouseErrorState error={error} />;

  const utilizationRate =
    warehouse.totalCapacity && warehouse.capacityUsed
      ? Math.round((warehouse.capacityUsed / warehouse.totalCapacity) * 100)
      : 0;

  return (
    <div className="space-y-6 container px-4 mt-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/warehouses">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{warehouse.name}</h1>
            <p className="text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {warehouse.address || "No address provided"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/inventory-locations/${id}/transactions`}>
              <BarChart2 className="mr-2 h-4 w-4" />
              Transactions
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setShowEditSheet(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Warehouse Details
            </CardTitle>
            <CardDescription>
              Detailed information about this inventory location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Address
                </h3>
                <p>{warehouse.address || "Not specified"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Manager
                </h3>
                <p>{warehouse.managerId || "Not assigned"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  Type
                </h3>
                <p>{warehouse?.locationType?.replace(/_/g, " ")}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Last Updated
                </h3>
                <p>{new Date(warehouse.updatedAt).toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Status
                </h3>
                <StatusBadge isActive={warehouse.isActive} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Default Location
                </h3>
                <Badge variant={warehouse.isDefault ? "default" : "outline"}>
                  {warehouse.isDefault ? "Yes" : "No"}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Description
              </h3>
              <p className="whitespace-pre-line">
                {warehouse.description || "No description provided"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Capacity
            </CardTitle>
            <CardDescription>
              Current storage utilization and metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="10"
                  />
                  {warehouse.totalCapacity && warehouse.capacityUsed && (
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke={
                        utilizationRate > 90
                          ? "#ef4444"
                          : utilizationRate > 70
                            ? "#f59e0b"
                            : "#10b981"
                      }
                      strokeWidth="10"
                      strokeDasharray={`${utilizationRate * 2.83} 283`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                  )}
                  <foreignObject x="25" y="25" width="50" height="50">
                    <div className="flex items-center justify-center w-full h-full">
                      <Package className="h-10 w-10 text-gray-500" />
                    </div>
                  </foreignObject>
                </svg>
              </div>
              <div className="text-center mt-4">
                <p className="text-2xl font-bold">
                  {warehouse.totalCapacity ? `${utilizationRate}%` : "N/A"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {warehouse.capacityUsed?.toLocaleString() || "0"} /{" "}
                  {warehouse.totalCapacity?.toLocaleString() || "0"} units
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Capacity Tracking
                </h3>
                <Badge
                  variant={warehouse.capacityTracking ? "default" : "outline"}
                >
                  {warehouse.capacityTracking ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              {warehouse.capacityUnit && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Capacity Unit
                  </h3>
                  <p>{warehouse.capacityUnit}</p>
                </div>
              )}
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
  );
}

function WarehouseDetailsSkeleton() {
  return (
    <div className="space-y-6 container px-4 mt-4">
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
  );
}

function WarehouseErrorState({ error }: { error?: Error }) {
  const router = useRouter();

  return (
    <div className="container px-4 mt-4">
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center gap-4 h-64">
          <div className="text-red-500 flex flex-col items-center gap-2">
            <AlertTriangle className="h-8 w-8" />
            <h3 className="font-medium">Failed to load warehouse</h3>
            <p className="text-sm text-muted-foreground text-center">
              {error?.message || "An unknown error occurred"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
            <Button onClick={() => router.refresh()}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  const status = isActive ? "ACTIVE" : "INACTIVE";
  const statusColors = {
    ACTIVE: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
    INACTIVE: "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200",
  };

  return (
    <Badge
      variant="outline"
      className={cn("font-medium", statusColors[status])}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}
