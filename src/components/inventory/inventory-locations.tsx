import { ExternalLink } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface InventoryLocationsProps {
  id: string
}

export function InventoryLocations({ id }: InventoryLocationsProps) {
  // Mock data for product locations
  const locations = [
    {
      id: "1",
      warehouse: "Main Warehouse",
      warehouseId: "1",
      zone: "Zone A",
      zoneId: "1",
      unit: "Rack A1",
      unitId: "1",
      position: "A1-B2-C3",
      positionId: "1",
      stock: 200,
      batchNumber: "BT-2023-042",
    },
    {
      id: "2",
      warehouse: "East Storage Facility",
      warehouseId: "4",
      zone: "Zone C",
      zoneId: "3",
      unit: "Shelf C3",
      unitId: "3",
      position: "C3-D4-E5",
      positionId: "2",
      stock: 142,
      batchNumber: "BT-2023-043",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Locations</CardTitle>
        <CardDescription>Where this product is stored across warehouses</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Warehouse</TableHead>
              <TableHead className="hidden md:table-cell">Zone</TableHead>
              <TableHead className="hidden lg:table-cell">Unit</TableHead>
              <TableHead className="hidden lg:table-cell">Position</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="hidden md:table-cell">Batch</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">
                  <Link href={`/warehouses/${location.warehouseId}`} className="flex items-center hover:underline">
                    {location.warehouse}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Link
                    href={`/warehouses/${location.warehouseId}/zones/${location.zoneId}`}
                    className="hover:underline"
                  >
                    {location.zone}
                  </Link>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Link
                    href={`/warehouses/${location.warehouseId}/units/${location.unitId}`}
                    className="hover:underline"
                  >
                    {location.unit}
                  </Link>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{location.position}</TableCell>
                <TableCell>{location.stock}</TableCell>
                <TableCell className="hidden md:table-cell">{location.batchNumber}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
