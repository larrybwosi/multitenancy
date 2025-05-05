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
  Plus,
  ArrowRight,
  Layers,
  Grid3X3,
  Boxes,
  DollarSign,
  BarChart,
} from "lucide-react";
import Link from "next/link";
import { WarehouseDeleteDialog } from "./warehouse-delete-dialog";
import { WarehouseEditSheet } from "./warehouse-edit-sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { InventoryLocation, StorageZone, StorageUnit } from "@/prisma/client";
import useSWR from "swr";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ZoneCreateDialog } from "./zone-create-dialog";
import { UnitCreateDialog } from "./unit-create-dialog";
import { WarehouseLayoutVisualization } from "./warehouse-layout-visualization";
import { useQueryState } from "nuqs";
import { useDeleteWarehouse, useUpdateWarehouse } from "@/hooks/use-warehouse";

interface WarehouseDetailsPageProps {
  id: string;
}

// Extended interfaces for better type safety
interface WarehouseWithDetails extends InventoryLocation {
  manager?: {
    id: string;
    name?: string;
  };
  zones?: StorageZone[];
  storageUnits?: (StorageUnit & {
    capacityUsed: number;
    productCount: number;
  })[];
  stockValue?: number;
  stockItems?: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    value: number;
    location?: {
      unitId: string;
      unitName: string;
      position: string;
    } | null;
  }[];
  productCount?: number;
}

// Type for storage metrics
interface StorageMetrics {
  totalUnits: number;
  occupiedUnits: number;
  utilizationRate: number;
  totalZones: number;
  totalProducts: number;
  stockValue: number;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch warehouse");
    return res.json();
  });

export function WarehouseDetailsPage({ id }: WarehouseDetailsPageProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditSheet, setShowEditSheet] = useQueryState('modal', {
      parse: v => v === 'true',
      serialize: v => (v ? 'true' : 'false'),
    });
  const [activeTab, setActiveTab] = useState("overview");
  const [storageMetrics, setStorageMetrics] = useState<StorageMetrics>({
    totalUnits: 0,
    occupiedUnits: 0,
    utilizationRate: 0,
    totalZones: 0,
    totalProducts: 0,
    stockValue: 0,
  });
  const [showZoneCreateDialog, setShowZoneCreateDialog] = useState(false);
  const [showUnitCreateDialog, setShowUnitCreateDialog] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const { mutateAsync: deleteWarehouse } = useDeleteWarehouse();
  const { mutateAsync: updateWarehouse } = useUpdateWarehouse(id);

  // Enhanced API call to get comprehensive warehouse data
  const { data, error, isLoading, mutate } = useSWR<{
    warehouse: WarehouseWithDetails;
  }>(`/api/warehouse/${id}`, fetcher, {
    onSuccess: (data) => {
      if (data?.warehouse) {
        // Calculate storage metrics
        const zones = data.warehouse.zones || [];
        const units = data.warehouse.storageUnits || [];
        const occupied = units.filter(unit => (unit.capacityUsed || 0) > 0).length;
        
        setStorageMetrics({
          totalUnits: units.length,
          occupiedUnits: occupied,
          utilizationRate: units.length > 0 ? Math.round((occupied / units.length) * 100) : 0,
          totalZones: zones.length,
          totalProducts: data.warehouse.productCount || 0,
          stockValue: data.warehouse.stockValue || 0,
        });
      }
    },
    onError: (err) => {
      toast.error("Error", {
        description: err.message || "Failed to load warehouse details",
      });
    },
    revalidateOnFocus: false,
    refreshInterval: 180000, // Auto-refresh every 3 minutes
  });

  const warehouse = data?.warehouse;

  const handleDelete = async () => {
    try {
      const response = await deleteWarehouse(id);
      console.log(response)
      mutate()
      toast.success("Success", {
        description: "Warehouse deleted successfully ",
      });

      router.push("/warehouses");
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
      const response = await updateWarehouse(formData);
      console.log(response)
      mutate()
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
            <Link href={`/warehouses/${id}/transactions`}>
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

      {/* Main content with tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="storage">Storage Layout</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Info Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Warehouse className="h-5 w-5" />
                  Warehouse Information
                </CardTitle>
                <CardDescription>
                  Detailed information about this warehouse location
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
                    <p>{warehouse.managerId 
                      ? "Manager assigned" 
                      : "Not assigned"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Info className="h-4 w-4" />
                      Type
                    </h3>
                    <p className="capitalize">{warehouse.locationType?.toString().toLowerCase().replace(/_/g, " ")}</p>
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

            {/* Capacity Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Capacity Overview
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
                      {warehouse.totalCapacity?.toLocaleString() || "0"} {warehouse.capacityUnit?.toString().toLowerCase() || "units"}
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
                      <p className="capitalize">{warehouse.capacityUnit.toString().toLowerCase().replace(/_/g, " ")}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="bg-blue-100 p-3 rounded-full mb-3">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{storageMetrics.totalProducts}</p>
                <p className="text-sm text-muted-foreground">Products</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="bg-green-100 p-3 rounded-full mb-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold">${storageMetrics.stockValue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Stock Value</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="bg-purple-100 p-3 rounded-full mb-3">
                  <Grid3X3 className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{storageMetrics.totalZones}</p>
                <p className="text-sm text-muted-foreground">Storage Zones</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center">
                <div className="bg-orange-100 p-3 rounded-full mb-3">
                  <Boxes className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-2xl font-bold">{storageMetrics.totalUnits}</p>
                <p className="text-sm text-muted-foreground">Storage Units</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Storage Layout Tab */}
        <TabsContent value="storage" className="space-y-6">
          <div className="flex flex-col space-y-6">
            {/* Quick Stats Cards for Storage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex flex-row items-center gap-4">
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <Layers className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Zones</p>
                    <p className="text-2xl font-bold">{storageMetrics.totalZones}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-row items-center gap-4">
                  <div className="bg-green-500 p-3 rounded-lg">
                    <Boxes className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Storage Units</p>
                    <p className="text-2xl font-bold">{storageMetrics.totalUnits}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-row items-center gap-4">
                  <div className="bg-purple-500 p-3 rounded-lg">
                    <Grid3X3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Occupied Units</p>
                    <p className="text-2xl font-bold">{storageMetrics.occupiedUnits} <span className="text-sm text-muted-foreground">of {storageMetrics.totalUnits}</span></p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-row items-center gap-4">
                  <div className="bg-orange-500 p-3 rounded-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Space Utilization</p>
                    <p className="text-2xl font-bold">{storageMetrics.utilizationRate}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Storage Zones Section */}
            <Card>
              <CardHeader className="border-b bg-muted/40">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-blue-600" />
                      Storage Zones
                    </CardTitle>
                    <CardDescription>
                      Manage storage zones and units within this warehouse
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowZoneCreateDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Zone
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {warehouse.zones && warehouse.zones.length > 0 ? (
                  <Accordion type="multiple" className="w-full">
                    {warehouse.zones.map((zone) => (
                      <AccordionItem key={zone.id} value={zone.id} className="border-b last:border-b-0">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30">
                          <div className="flex justify-between items-center w-full pr-4">
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-100 p-2 rounded-md">
                                <Layers className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="text-left">
                                <div className="font-medium">{zone.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {zone.description ? zone.description.substring(0, 50) + (zone.description.length > 50 ? '...' : '') : 'No description'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-6 ml-8">
                              <div className="text-sm text-right">
                                <div className="font-medium">{zone.capacityUsed || 0}/{zone.capacity || 0}</div>
                                <div className="text-xs text-muted-foreground">
                                  {zone.capacityUnit?.toString().toLowerCase() || 'units'} used
                                </div>
                              </div>
                              <div className="w-24">
                                <Progress 
                                  value={(zone.capacityUsed || 0) / (zone.capacity || 1) * 100} 
                                  className="h-2"
                                  indicatorClassName={
                                    ((zone.capacityUsed || 0) / (zone.capacity || 1) * 100) > 90 
                                      ? "bg-red-500" 
                                      : ((zone.capacityUsed || 0) / (zone.capacity || 1) * 100) > 70 
                                        ? "bg-orange-500" 
                                        : "bg-green-500"
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-0">
                          <div className="p-6 pt-2 space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <h4 className="text-sm font-medium">Zone Details</h4>
                                <p className="text-sm text-muted-foreground">{zone.description || "No description available"}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                                  Edit Zone
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash className="h-3.5 w-3.5 mr-1.5" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            
                            <div className="border-t pt-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-medium flex items-center gap-1.5">
                                  <Boxes className="h-4 w-4 text-muted-foreground" />
                                  Storage Units
                                </h4>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8"
                                  onClick={() => {
                                    setSelectedZoneId(zone.id);
                                    setShowUnitCreateDialog(true);
                                  }}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                                  Add Unit
                                </Button>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                                {/* We'll combine real data with some placeholders */}
                                {warehouse.storageUnits && warehouse.storageUnits
                                  .filter(unit => unit.zoneId === zone.id)
                                  .map(unit => (
                                    <Card key={unit.id} className="border shadow-sm hover:shadow-md transition-shadow">
                                      <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h5 className="font-medium">{unit.name}</h5>
                                            <p className="text-xs text-muted-foreground capitalize">
                                              {unit.unitType?.toString().toLowerCase().replace(/_/g, ' ') || 'Standard unit'}
                                            </p>
                                          </div>
                                          <Badge className={
                                            unit.capacityUsed && unit.capacity && 
                                            (unit.capacityUsed / unit.capacity) > 0.9
                                              ? 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200'
                                              : (unit.capacityUsed || 0) > 0
                                                ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200'
                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200'
                                          }>
                                            {unit.capacityUsed && unit.capacity 
                                              ? `${Math.round((unit.capacityUsed / unit.capacity) * 100)}% Full` 
                                              : 'Empty'}
                                          </Badge>
                                        </div>
                                        
                                        <div className="mt-3 mb-2">
                                          <Progress 
                                            value={unit.capacity ? (unit.capacityUsed / unit.capacity) * 100 : 0}
                                            className="h-1"
                                          />
                                        </div>
                                        
                                        <div className="flex justify-between text-xs text-muted-foreground mt-3">
                                          <span>{unit.productCount || 0} products</span>
                                          <div className="flex gap-2 text-gray-500">
                                            <button className="hover:text-blue-600">
                                              <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button className="hover:text-blue-600">
                                              <Package className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}

                                {/* Display placeholder units only if there are no real units for this zone */}
                                {(!warehouse.storageUnits || warehouse.storageUnits.filter(unit => unit.zoneId === zone.id).length === 0) && (
                                  <>
                                    <Card className="border shadow-sm hover:shadow-md transition-shadow">
                                      <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h5 className="font-medium">Rack A1</h5>
                                            <p className="text-xs text-muted-foreground">Pallet storage</p>
                                          </div>
                                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
                                            75% Full
                                          </Badge>
                                        </div>
                                        
                                        <div className="mt-3 mb-2">
                                          <Progress value={75} className="h-1" />
                                        </div>
                                        
                                        <div className="flex justify-between text-xs text-muted-foreground mt-3">
                                          <span>12 products</span>
                                          <div className="flex gap-2 text-gray-500">
                                            <button className="hover:text-blue-600">
                                              <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button className="hover:text-blue-600">
                                              <Package className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    
                                    <Card className="border shadow-sm hover:shadow-md transition-shadow">
                                      <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h5 className="font-medium">Bin B3</h5>
                                            <p className="text-xs text-muted-foreground">Small items</p>
                                          </div>
                                          <Badge variant="outline">
                                            Empty
                                          </Badge>
                                        </div>
                                        
                                        <div className="mt-3 mb-2">
                                          <Progress value={0} className="h-1" />
                                        </div>
                                        
                                        <div className="flex justify-between text-xs text-muted-foreground mt-3">
                                          <span>0 products</span>
                                          <div className="flex gap-2 text-gray-500">
                                            <button className="hover:text-blue-600">
                                              <Edit className="h-3.5 w-3.5" />
                                            </button>
                                            <button className="hover:text-blue-600">
                                              <Package className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="bg-blue-50 p-4 rounded-full mb-4">
                      <Layers className="h-12 w-12 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No Storage Zones</h3>
                    <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                      Storage zones help you organize your warehouse into logical areas. Create your first zone to start organizing inventory.
                    </p>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setShowZoneCreateDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Zone
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Layout Visualization */}
            <Card>
              <CardHeader className="border-b bg-muted/40">
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5 text-blue-600" />
                  Layout Visualization
                </CardTitle>
                <CardDescription>
                  Visual overview of your warehouse floor plan and storage areas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {warehouse.zones && warehouse.zones.length > 0 ? (
                  <WarehouseLayoutVisualization 
                    warehouseId={id} 
                    zones={warehouse.zones || []}
                    units={warehouse.storageUnits || []}
                  />
                ) : (
                  <div className="border rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="bg-blue-100 p-4 rounded-full mb-4">
                      <Grid3X3 className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-center">Create Zones First</h3>
                    <p className="text-sm text-center text-muted-foreground max-w-md mb-6">
                      Add storage zones to visualize your warehouse layout. 
                      Once you&apos;ve created zones, the interactive layout will be available.
                    </p>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setShowZoneCreateDialog(true)}
                    >
                      <Layers className="mr-2 h-4 w-4" />
                      Create First Zone
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="flex flex-col space-y-6">
            {/* Inventory Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 flex flex-row items-center gap-4">
                  <div className="bg-indigo-500 p-3 rounded-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-indigo-600 font-medium">Total Products</p>
                    <p className="text-2xl font-bold">{storageMetrics.totalProducts}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-row items-center gap-4">
                  <div className="bg-emerald-500 p-3 rounded-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600 font-medium">Stock Value</p>
                    <p className="text-2xl font-bold">${storageMetrics.stockValue.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex flex-row items-center gap-4">
                  <div className="bg-amber-500 p-3 rounded-lg">
                    <ArrowRight className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-amber-600 font-medium">Avg. Turnover</p>
                    <p className="text-2xl font-bold">14 days</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter and Actions Bar */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/40 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-indigo-600" />
                      Inventory Items
                    </CardTitle>
                    <CardDescription>
                      Products and stock items stored in this warehouse
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Input
                        className="h-9 pl-8 w-[180px] text-sm" 
                        placeholder="Search items..." 
                      />
                      <div className="absolute left-2.5 top-2.5 text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                      </div>
                    </div>
                    <Select>
                      <SelectTrigger className="h-9 w-[120px] text-sm">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="h-9">
                      <ArrowRight className="h-4 w-4 mr-1.5" />
                      Move Items
                    </Button>
                    <Button size="sm" className="h-9 bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Items
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <div className="p-0">
                {warehouse.stockItems && warehouse.stockItems.length > 0 ? (
                  <div className="relative overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr className="border-b">
                          <th scope="col" className="px-6 py-3 text-left font-medium">
                            Product
                          </th>
                          <th scope="col" className="px-6 py-3 text-left font-medium">
                            SKU/ID
                          </th>
                          <th scope="col" className="px-6 py-3 text-center font-medium">
                            Quantity
                          </th>
                          <th scope="col" className="px-6 py-3 text-right font-medium">
                            Value
                          </th>
                          <th scope="col" className="px-6 py-3 text-left font-medium">
                            Location
                          </th>
                          <th scope="col" className="px-6 py-3 text-right font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {warehouse.stockItems.map((item) => (
                          <tr key={item.id} className="bg-white hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-md flex items-center justify-center">
                                  <Package className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="font-medium text-gray-900">{item.productName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {item.productId.substring(0, 8)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {item.quantity}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                              ${item.value.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center text-sm text-gray-700">
                                <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                {item.location ? 
                                  `${item.location.unitName} / ${item.location.position}` :
                                  "General Storage"
                                }
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-1">
                              <Button variant="ghost" className="h-8 px-2 text-indigo-700">
                                View
                              </Button>
                              <Button variant="ghost" className="h-8 px-2 text-indigo-700">
                                Move
                              </Button>
                              <Button variant="ghost" className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t px-4 py-3 bg-white">
                      <div className="flex items-center text-sm text-gray-500">
                        Showing <span className="font-medium mx-1">1</span> to <span className="font-medium mx-1">{warehouse.stockItems.length}</span> of <span className="font-medium mx-1">{warehouse.stockItems.length}</span> items
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" disabled>Previous</Button>
                        <Button variant="outline" size="sm" disabled>Next</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="bg-indigo-50 p-4 rounded-full mb-4">
                      <Package className="h-12 w-12 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No Inventory Items</h3>
                    <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                      There are no inventory items stored in this warehouse yet. Add products to start tracking your inventory.
                    </p>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Item
                    </Button>
                  </div>
                )}
              </div>
            </Card>
            
            {/* Low Stock Alerts Card */}
            <Card>
              <CardHeader className="border-b bg-muted/40">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Low Stock Alerts
                </CardTitle>
                <CardDescription>
                  Products that are running low and need to be replenished
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr className="border-b">
                      <th scope="col" className="px-6 py-3 text-left font-medium">
                        Product
                      </th>
                      <th scope="col" className="px-6 py-3 text-center font-medium">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-center font-medium">
                        Threshold
                      </th>
                      <th scope="col" className="px-6 py-3 text-right font-medium">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {/* Sample low stock items */}
                    <tr className="bg-white hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-red-100 rounded-md flex items-center justify-center">
                            <Package className="h-4 w-4 text-red-600" />
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">Widget XYZ</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-medium text-red-600">
                        2
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                        10
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Critical
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="outline" className="h-7 text-xs">Order</Button>
                      </td>
                    </tr>
                    <tr className="bg-white hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-amber-100 rounded-md flex items-center justify-center">
                            <Package className="h-4 w-4 text-amber-600" />
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">Gadget ABC</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center font-medium text-amber-600">
                        8
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                        15
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Low
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Button variant="outline" className="h-7 text-xs">Order</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Warehouse Analytics
              </CardTitle>
              <CardDescription>
                Performance metrics and analytics for this warehouse
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="text-center">
                <BarChart2 className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">Analytics Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  We&apos;re working on comprehensive analytics for your warehouse operations.
                  Check back soon for utilization trends, inventory turnover, and more.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <WarehouseDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        warehouseName={warehouse.name}
      />

      <WarehouseEditSheet
        open={showEditSheet as boolean}
        onOpenChange={setShowEditSheet}
        warehouse={warehouse  as any}
        onSave={handleUpdate}
      />

      <ZoneCreateDialog 
        open={showZoneCreateDialog}
        onOpenChange={setShowZoneCreateDialog}
        warehouseId={id}
      />

      <UnitCreateDialog
        open={showUnitCreateDialog}
        onOpenChange={setShowUnitCreateDialog}
        warehouseId={id}
        zoneId={selectedZoneId || ""}
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
