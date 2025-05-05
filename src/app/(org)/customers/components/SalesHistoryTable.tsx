"use client";

import { PaymentStatus, Prisma } from "@/prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomBadge } from "@/components/ui/CustomBadge";
import { formatDate, formatCurrency } from "@/lib/utils";

type SaleSummary = {
  id: string;
  saleNumber: string;
  saleDate: Date;
  finalAmount: Prisma.Decimal;
  paymentStatus: PaymentStatus;
};

interface SalesHistoryTableProps {
  sales: SaleSummary[];
}

export function SalesHistoryTable({ sales }: SalesHistoryTableProps) {
  const getStatusVariant = (
    status: PaymentStatus
  ): React.ComponentProps<typeof CustomBadge>["variant"] => {
    switch (status) {
      case "COMPLETED":
        return "active";
      case "PENDING":
        return "secondary";
      case "REFUNDED":
      case "PARTIALLY_REFUNDED":
        return "destructive";
      case "FAILED":
      case "CANCELLED":
        return "inactive";
      default:
        return "outline";
    }
  };

  const formatStatus = (status: PaymentStatus) => {
    return status.replace(/_/g, " "); // Make enum keys more readable
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sale #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>{" "}
            {/* Optional */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length > 0 ? (
            sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.saleNumber}</TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(sale.saleDate, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <CustomBadge variant={getStatusVariant(sale.paymentStatus)}>
                    {formatStatus(sale.paymentStatus)}
                  </CustomBadge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(sale.finalAmount)}
                </TableCell>
                <TableCell className="text-right">
                  {/* Example: Link to a detailed sale view if it exists */}
                  {/* <Link href={`/dashboard/sales/${sale.id}`} passHref>
                                         <Button variant="outline" size="sm">View</Button>
                                     </Link> */}
                  -
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No sales history found for this customer.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
