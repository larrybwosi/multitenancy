"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Mail, Phone, ExternalLink } from "lucide-react"

interface TopCustomersTableProps {
  customers: any[]
}

export function TopCustomersTable({ customers }: TopCustomersTableProps) {
  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead>Last Purchase</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div>
                    <div>{customer.name}</div>
                    <div className="text-xs text-muted-foreground">{customer.id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{customer.type}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(customer.totalSpent)}</TableCell>
                <TableCell className="text-right">{customer.orders}</TableCell>
                <TableCell>{customer.lastPurchase}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      customer.segment === "VIP"
                        ? "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200"
                        : customer.segment === "Loyal"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200"
                          : "bg-green-100 text-green-800 hover:bg-green-200 border-green-200"
                    }
                  >
                    {customer.segment}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Mail className="h-4 w-4" />
                      <span className="sr-only">Email</span>
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Phone className="h-4 w-4" />
                      <span className="sr-only">Call</span>
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 border rounded-md bg-muted/50">
        <h3 className="text-sm font-medium mb-2">Top Customer Insights</h3>
        <p className="text-sm text-muted-foreground">
          Your top 10 customers represent approximately{" "}
          <span className="font-medium">
            {Math.round((customers.reduce((sum, c) => sum + c.totalSpent, 0) / 100000) * 100)}%
          </span>{" "}
          of your total revenue. Consider implementing a key account management strategy to nurture these relationships
          and maximize retention.
        </p>
      </div>
    </div>
  )
}
