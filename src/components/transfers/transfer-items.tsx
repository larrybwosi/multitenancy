import { ExternalLink } from "lucide-react"
import Link from "next/link"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TransferItemsProps {
  id: string
}

export function TransferItems({ id }: TransferItemsProps) {
  // Mock data for transfer items
  const items = [
    {
      id: "1",
      product: "Smartphone X1",
      sku: "SP-X1-001",
      quantity: 25,
      batchNumber: "BT-2023-042",
      fromZone: "Zone A",
      toZone: "Zone C",
    },
    {
      id: "2",
      product: "Wireless Headphones",
      sku: "WH-BT-002",
      quantity: 40,
      batchNumber: "BT-2023-043",
      fromZone: "Zone B",
      toZone: "Zone A",
    },
    {
      id: "3",
      product: "Laptop Pro 15",
      sku: "LP-15-003",
      quantity: 12,
      batchNumber: "BT-2023-044",
      fromZone: "Zone A",
      toZone: "Zone B",
    },
    {
      id: "4",
      product: "Smart Watch Series 5",
      sku: "SW-S5-004",
      quantity: 30,
      batchNumber: "BT-2023-045",
      fromZone: "Zone C",
      toZone: "Zone A",
    },
    {
      id: "5",
      product: "Bluetooth Speaker",
      sku: "BS-JBL-005",
      quantity: 18,
      batchNumber: "BT-2023-046",
      fromZone: "Zone B",
      toZone: "Zone C",
    },
    {
      id: "6",
      product: "Tablet Pro 10",
      sku: "TP-10-006",
      quantity: 15,
      batchNumber: "BT-2023-047",
      fromZone: "Zone A",
      toZone: "Zone B",
    },
    {
      id: "7",
      product: "Wireless Charger",
      sku: "WC-QI-007",
      quantity: 16,
      batchNumber: "BT-2023-048",
      fromZone: "Zone C",
      toZone: "Zone A",
    },
  ]

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Product</TableHead>
          <TableHead className="hidden md:table-cell">SKU</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead className="hidden lg:table-cell">Batch</TableHead>
          <TableHead className="hidden md:table-cell">From Zone</TableHead>
          <TableHead className="hidden md:table-cell">To Zone</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              <Link href={`/inventory/${item.id}`} className="flex items-center hover:underline">
                {item.product}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </TableCell>
            <TableCell className="hidden md:table-cell">{item.sku}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell className="hidden lg:table-cell">{item.batchNumber}</TableCell>
            <TableCell className="hidden md:table-cell">{item.fromZone}</TableCell>
            <TableCell className="hidden md:table-cell">{item.toZone}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
