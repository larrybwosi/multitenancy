// components/admin/audit-log-table.tsx
// This is primarily a display component
import { AuditLog } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import { format } from "date-fns"; // For formatting dates

// Extend the type to potentially include nested user info if fetched
type AuditLogWithUser = AuditLog & {
  user?: {
    // Make user optional as it might be null
    user: {
      // Nested user within member
      name?: string | null;
      email?: string | null;
    } | null;
  } | null;
};

interface AuditLogTableProps {
  logs: AuditLogWithUser[];
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  const formatAction = (action: string) =>
    action.charAt(0) + action.slice(1).toLowerCase().replace(/_/g, " ");
  const formatType = (type: string) =>
    type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, " ");

  return (
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            {/* <TableHead>Details</TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(log.performedAt), "PPpp")}{" "}
                {/* Format date nicely */}
              </TableCell>
              <TableCell>
                {log.user?.user?.name ?? log.user?.user?.email ?? (
                  <span className="text-muted-foreground italic">
                    System/Unknown
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    log.action === "DELETE"
                      ? "destructive"
                      : log.action === "CREATE"
                        ? "default"
                        : "secondary"
                  }
                >
                  {formatAction(log.action)}
                </Badge>
              </TableCell>
              <TableCell className="capitalize">
                {formatType(log.type)}
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {log.description}
              </TableCell>
              {/* <TableCell>
                  {log.metadata ? (
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-1 rounded overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  ) : '-'}
              </TableCell> */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {logs.length === 0 && (
        <p className="p-6 text-center text-muted-foreground">
          No audit logs found.
        </p>
      )}
    </CardContent>
  );
}
