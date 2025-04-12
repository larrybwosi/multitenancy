import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface POSRecentSalesProps {
  sales: any[]
}

export function POSRecentSales({ sales }: POSRecentSalesProps) {
  if (sales.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No recent sales</p>
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium">{sale.id}</TableCell>
              <TableCell>{sale.customer}</TableCell>
              <TableCell>{sale.items}</TableCell>
              <TableCell>{new Date(sale.date).toLocaleString()}</TableCell>
              <TableCell className="text-right">{formatCurrency(sale.total)}</TableCell>
              <TableCell>
                <SaleStatusBadge status={sale.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function SaleStatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
    PENDING: "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200",
    CANCELLED: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
  }

  const colorClass = statusColors[status] || "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"

  return (
    <Badge variant="outline" className={cn("font-medium", colorClass)}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  )
}
