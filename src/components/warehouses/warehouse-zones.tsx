import { Box, ExternalLink, Grid3X3, MoreHorizontal, Plus } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface WarehouseZonesProps {
  id: string
}

export function WarehouseZones({ id }: WarehouseZonesProps) {
  // Mock data for zones
  const zones = [
    {
      id: "1",
      name: "Zone A",
      description: "Electronics section",
      capacity: 85,
      units: 42,
      isActive: true,
    },
    {
      id: "2",
      name: "Zone B",
      description: "Home appliances",
      capacity: 62,
      units: 36,
      isActive: true,
    },
    {
      id: "3",
      name: "Zone C",
      description: "Clothing and accessories",
      capacity: 45,
      units: 28,
      isActive: true,
    },
    {
      id: "4",
      name: "Zone D",
      description: "Furniture and home decor",
      capacity: 78,
      units: 50,
      isActive: true,
    },
  ]

  // Mock data for storage units
  const units = [
    {
      id: "1",
      name: "Rack A1",
      zoneId: "1",
      zoneName: "Zone A",
      type: "RACK",
      capacity: 92,
      isOccupied: true,
      positions: 24,
    },
    {
      id: "2",
      name: "Bin B12",
      zoneId: "2",
      zoneName: "Zone B",
      type: "BIN",
      capacity: 45,
      isOccupied: true,
      positions: 8,
    },
    {
      id: "3",
      name: "Shelf C3",
      zoneId: "3",
      zoneName: "Zone C",
      type: "SHELF",
      capacity: 78,
      isOccupied: true,
      positions: 12,
    },
    {
      id: "4",
      name: "Pallet D7",
      zoneId: "4",
      zoneName: "Zone D",
      type: "PALLET",
      capacity: 65,
      isOccupied: true,
      positions: 4,
    },
    {
      id: "5",
      name: "Rack A2",
      zoneId: "1",
      zoneName: "Zone A",
      type: "RACK",
      capacity: 88,
      isOccupied: true,
      positions: 24,
    },
    {
      id: "6",
      name: "Bulk Area E1",
      zoneId: null,
      zoneName: "No Zone",
      type: "BULK_AREA",
      capacity: 55,
      isOccupied: true,
      positions: 0,
    },
  ]

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              Zones
            </CardTitle>
            <CardDescription>Storage zones within this warehouse</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href={`/warehouses/${id}/zones/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Zone
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Units</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">
                    <Link href={`/warehouses/${id}/zones/${zone.id}`} className="flex items-center hover:underline">
                      {zone.name}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{zone.description}</TableCell>
                  <TableCell>
                    <div className="flex w-full items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${
                            zone.capacity > 80 ? "bg-rose-500" : zone.capacity > 60 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${zone.capacity}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums">{zone.capacity}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{zone.units}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/warehouses/${id}/zones/${zone.id}`}>
                            <Grid3X3 className="mr-2 h-4 w-4" />
                            View Zone
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/warehouses/${id}/zones/${zone.id}/edit`}>Edit Zone</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/warehouses/${id}/zones/${zone.id}/units/new`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Unit
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Storage Units
            </CardTitle>
            <CardDescription>Storage units within this warehouse</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href={`/warehouses/${id}/units/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Unit
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead className="hidden md:table-cell">Positions</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">
                    <Link href={`/warehouses/${id}/units/${unit.id}`} className="flex items-center hover:underline">
                      {unit.name}
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    {unit.zoneId ? (
                      <Link
                        href={`/warehouses/${id}/zones/${unit.zoneId}`}
                        className="text-sm text-muted-foreground hover:underline"
                      >
                        {unit.zoneName}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">{unit.zoneName}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        unit.type === "RACK"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500"
                          : unit.type === "BIN"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-500"
                            : unit.type === "SHELF"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-500"
                              : unit.type === "PALLET"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
                                : "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-500"
                      }`}
                    >
                      {unit.type
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(" ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex w-full items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div
                          className={`h-full rounded-full ${
                            unit.capacity > 80 ? "bg-rose-500" : unit.capacity > 60 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${unit.capacity}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums">{unit.capacity}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{unit.positions}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/warehouses/${id}/units/${unit.id}`}>
                            <Box className="mr-2 h-4 w-4" />
                            View Unit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/warehouses/${id}/units/${unit.id}/edit`}>Edit Unit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/warehouses/${id}/units/${unit.id}/positions/new`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Position
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
