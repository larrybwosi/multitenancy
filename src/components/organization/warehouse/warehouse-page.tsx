"use client";

import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Boxes, AlertTriangle } from "lucide-react";
import { WarehouseList } from "./warehouse-list";
import { WarehouseStats } from "./warehouse-stats";
import { WarehouseCreateSheet } from "./warehouse-create-sheet";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { toast } from "sonner";
import { InventoryLocation } from "@prisma/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      throw new Error("Failed to fetch warehouses");
    }
    return res.json();
  });

export function WarehousePage() {
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{
    warehouses: InventoryLocation[];
  }>("/api/warehouse", fetcher, {
    refreshInterval: 120000, // Auto-refresh every 2 minutes
    revalidateOnFocus: false,
    onError: (err) => {
      toast.error("Error", {
        description: err.message || "Failed to load warehouses",
      });
    },
  });

  const handleCreateSuccess = () => {
    mutate(); // Revalidate the data
    setShowCreateSheet(false);
    toast.success("Success", {
      description: "Warehouse created successfully",
    });
  };

  return (
    <div className="space-y-6 container px-4 mt-4">
      <div className="flex justify-between items-center">
        <SectionHeader
          title="Warehouse Management"
          subtitle="Manage your organization's warehouses and storage facilities"
          icon={<Boxes className="h-8 w-8 text-gray-600" />}
          autoUpdate="2 min"
        />
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowCreateSheet(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 flex flex-col items-center gap-2">
              <AlertTriangle className="h-8 w-8" />
              <p>Failed to load warehouse data</p>
              <Button
                variant="outline"
                onClick={() => mutate()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <WarehouseStats
            warehouses={data?.warehouses || []}
            loading={isLoading}
          />

          <Card>
            <CardHeader>
              <CardTitle>Warehouses</CardTitle>
              <CardDescription>
                View and manage all warehouses. Monitor capacity, inventory
                levels, and warehouse status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <WarehouseList
                  warehouses={data?.warehouses || []}
                  loading={isLoading}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      <WarehouseCreateSheet
        open={showCreateSheet}
        onOpenChange={setShowCreateSheet}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
