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
import type { FinancialData } from "@/types/reports"

interface FinancialRatiosTableProps {
  data?: FinancialData["ratios"]
}

export function FinancialRatiosTable({ data }: FinancialRatiosTableProps) {
  if (!data) return null

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ratio</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((ratio) => (
          <TableRow key={ratio.name}>
            <TableCell className="font-medium">{ratio.name}</TableCell>
            <TableCell>{ratio.value}</TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {ratio.description}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  ratio.status === "good"
                    ? "success"
                    : ratio.status === "warning"
                    ? "warning"
                    : "destructive"
                }
              >
                {ratio.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
