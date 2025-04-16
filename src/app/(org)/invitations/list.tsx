"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, Search, RefreshCw, XCircle, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useInvitations, useCancelInvitation, useResendInvitation } from "@/hooks/use-invitations";

export function InvitationsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: invitations, isLoading } = useInvitations();
  const cancelInvitation = useCancelInvitation();
  const resendInvitation = useResendInvitation();

  const filteredInvitations = invitations?.filter(
    (invitation) =>
      invitation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invitation.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invitation.status.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCancelInvitation = (invitationId: string, email: string) => {
    cancelInvitation.mutate(invitationId, {
      onSuccess: () => {
        toast.success("Invitation cancelled", {
          description: `Invitation to ${email} has been cancelled.`,
        });
      }
    });
  };

  const handleResendInvitation = (invitationId: string, email: string) => {
    resendInvitation.mutate(invitationId, {
      onSuccess: () => {
        toast.success("Invitation resent", {
          description: `Invitation has been resent to ${email}.`,
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="rounded-md border">
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invitations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">{invitation.email}</TableCell>
                <TableCell>
                  <RoleBadge role={invitation.role} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={invitation.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resend
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                        className="text-destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => window.location.href = `mailto:${invitation.email}`}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn({
        "bg-blue-50 text-blue-700 hover:bg-blue-50": role === "ADMIN",
        "bg-green-50 text-green-700 hover:bg-green-50": role === "MEMBER",
        "bg-gray-50 text-gray-700 hover:bg-gray-50": role === "VIEWER",
      })}
    >
      {role.toLowerCase()}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn({
        "bg-yellow-50 text-yellow-700 hover:bg-yellow-50": status === "PENDING",
        "bg-green-50 text-green-700 hover:bg-green-50": status === "ACCEPTED",
        "bg-red-50 text-red-700 hover:bg-red-50":
          status === "DECLINED" || status === "EXPIRED",
      })}
    >
      {status.toLowerCase()}
    </Badge>
  );
}
