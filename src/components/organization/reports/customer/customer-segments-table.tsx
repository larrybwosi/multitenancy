"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { CustomerData } from "@/types/reports"

interface CustomerSegmentsTableProps {
  data?: CustomerData["segments"]
}

export function CustomerSegmentsTable({ data }: CustomerSegmentsTableProps) {
  if (!data) return null

  const totalCustomers = data.reduce((sum, segment) => sum + segment.customers, 0)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Segment</TableHead>
          <TableHead className="text-right">Customers</TableHead>
          <TableHead className="text-right">% of Total</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">Avg. Order</TableHead>
          <TableHead className="text-right">Frequency</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((segment) => (
          <TableRow key={segment.segment}>
            <TableCell className="font-medium">
              <Badge 
                variant="outline" 
                className={
                  segment.segment === "VIP" 
                    ? "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200" 
                    : segment.segment === "Loyal"
                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
                    : "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                }
              >
                {segment.segment}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {segment.customers.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              {((segment.customers / totalCustomers) * 100).toFixed(1)}%
            </TableCell>
            <TableCell className="text-right">
              ${segment.revenue.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              ${segment.averageOrder.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              {segment.frequency.toFixed(1)}x
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}