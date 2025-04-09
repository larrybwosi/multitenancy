"use client";

import { LoyaltyReason, Prisma } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomBadge } from "@/components/ui/CustomBadge"; // Use custom badge
import { formatDate } from "@/lib/utils"; // Adjust path

type LoyaltyTransactionWithUser = Prisma.LoyaltyTransactionGetPayload<{
  include: { user: { select: { name: true; email: true } } };
}>;

interface LoyaltyHistoryTableProps {
  transactions: LoyaltyTransactionWithUser[];
}

export function LoyaltyHistoryTable({
  transactions,
}: LoyaltyHistoryTableProps) {
  const getPointsStyle = (points: number) => {
    if (points > 0) return "text-green-600 font-medium";
    if (points < 0) return "text-red-600 font-medium";
    return "text-gray-500";
  };

  const formatReason = (reason: LoyaltyReason) => {
    return reason.replace(/_/g, " "); // Make enum keys more readable
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Points Change</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Processed By</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Related Sale</TableHead> {/* Optional */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length > 0 ? (
            transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(tx.transactionDate)}
                </TableCell>
                <TableCell
                  className={`text-right ${getPointsStyle(tx.pointsChange)}`}
                >
                  {tx.pointsChange > 0
                    ? `+${tx.pointsChange}`
                    : tx.pointsChange}
                </TableCell>
                <TableCell>
                  <CustomBadge
                    variant={
                      tx.reason === "REDEMPTION" ? "destructive" : "secondary"
                    }
                  >
                    {formatReason(tx.reason)}
                  </CustomBadge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {tx.user?.name || tx.user?.email || "System/Unknown"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {tx.notes || "-"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {/* Link to sale if needed */}
                  {tx.relatedSaleId || "-"}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No loyalty transactions found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
