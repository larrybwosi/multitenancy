// components/admin/members-table.tsx
"use client";

import React, { useState, useTransition } from "react";
import { User, Member, UserRole } from "@prisma/client"; // Make sure UserRole is imported
import { Button } from "@/components/ui/button";
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  UserPlus,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select
import {
  inviteMember,
  updateMemberRole,
  banMember,
  unbanMember,
} from "@/actions/admin-actions";
import { toast } from "sonner";
import { CardContent } from "@/components/ui/card";

// Define the combined type explicitly
// Extend Member type to include the nested User object structure
type MemberWithUser = Member & {
  user: Pick<
    User,
    "id" | "name" | "email" | "image" | "banned" | "banReason" | "role"
  >;
};

interface MembersTableProps {
  members: MemberWithUser[];
  organizationId: string;
}

export function MembersTable({ members, organizationId }: MembersTableProps) {
  const [isPending, startTransition] = useTransition();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.EMPLOYEE); // Default role for invite
  const [banReason, setBanReason] = useState("");
  const [isInviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isBanDialogOpen, setBanDialogOpen] = useState(false);
  const [memberToBan, setMemberToBan] = useState<MemberWithUser | null>(null);

  // --- Handlers ---
  const handleInvite = async () => {
    // Basic client-side validation
    if (!inviteEmail || !inviteRole) {
      toast.error( "Error",{
        description: "Please provide email and role.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("organizationId", organizationId);
    formData.append("email", inviteEmail);
    formData.append("role", inviteRole); // Pass role string

    startTransition(async () => {
      // Server action 'inviteMember' expects (prevState, formData)
      // We don't have prevState here in this direct call pattern,
      // so we might need a wrapper or adjust the action if using useFormState isn't feasible here.
      // For simplicity, let's assume inviteMember can be called directly for now,
      // or adapt it. A better approach is using a form + useFormState for the dialog.
      // Let's simulate the form submission approach for consistency:
      const result = await inviteMember(null, formData); // Pass null for prevState

      toast(result.success ? "Success" : "Error",{
        description: result.message,
      });
      if (result.success) {
        setInviteEmail("");
        setInviteRole(UserRole.EMPLOYEE);
        setInviteDialogOpen(false); // Close dialog on success
      }
    });
  };

  const handleRoleChange = (memberId: string, newRole: UserRole) => {
    startTransition(async () => {
      const result = await updateMemberRole({ memberId, role: newRole });
      toast( result.success ? "Success" : "Role Updated",{
        description: result.message,
      });
    });
  };

  const handleBan = () => {
    if (!memberToBan) return;

    startTransition(async () => {
      const result = await banMember({
        userId: memberToBan.user.id,
        memberId: memberToBan.id,
        banReason: banReason || null, // Pass null if empty
      });
      toast( result.success ? "Success" : "Error",{
        description: result.message,
      });
      if (result.success) {
        setBanReason("");
        setMemberToBan(null);
        setBanDialogOpen(false);
      }
    });
  };

  const handleUnban = (member: MemberWithUser) => {
    startTransition(async () => {
      const result = await unbanMember({
        userId: member.user.id,
        memberId: member.id,
      });
      // toast({
      //   title: result.success ? "Success" : "Error",
      //   description: result.message,
      //   variant: result.success ? "default" : "destructive",
      // });
    });
  };

  // --- Render ---
  return (
    <CardContent className="p-0">
      {" "}
      {/* Remove default padding */}
      {/* Invite Member Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogTrigger asChild>
          <div className="flex justify-end p-4">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> Invite Member
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite New Member</DialogTitle>
            <DialogDescription>
              Enter the email address and select a role for the new member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invite-email" className="text-right">
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="col-span-3"
                placeholder="member@example.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invite-role" className="text-right">
                Role
              </Label>
              <Select
                value={inviteRole}
                onValueChange={(value) => setInviteRole(value as UserRole)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(UserRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role.charAt(0) + role.slice(1).toLowerCase()}{" "}
                      {/* Nicer formatting */}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleInvite} disabled={isPending}>
              {isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Ban Member Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Ban Member: {memberToBan?.user.name ?? memberToBan?.user.email}
            </DialogTitle>
            <DialogDescription>
              Provide a reason for banning this member. This action can be
              reversed.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="ban-reason">Reason (Optional)</Label>
            <Input
              id="ban-reason"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="e.g., Violation of terms"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={isPending}
            >
              {isPending ? "Banning..." : "Confirm Ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Members Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Avatar</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={member.user.image ?? undefined}
                    alt={member.user.name ?? "User Avatar"}
                  />
                  <AvatarFallback>
                    {member.user.name
                      ? member.user.name.charAt(0).toUpperCase()
                      : member.user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">
                {member.user.name ?? (
                  <span className="text-muted-foreground">No Name</span>
                )}
              </TableCell>
              <TableCell>{member.user.email}</TableCell>
              <TableCell>
                <Badge
                  variant={member.role === "ADMIN" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {/* Display Member role string, fallback to User role enum if needed */}
                  {(member.role ?? member.user.role)?.toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell>
                {member.user.banned ? (
                  <Badge variant="destructive">Banned</Badge>
                ) : (
                  <Badge variant="outline">Active</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
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
                    {/* --- Change Role --- */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <span>Change Role</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          <DropdownMenuRadioGroup
                            // Use member.role (string) if it's the primary source, fallback to user.role
                            value={member.role ?? member.user.role}
                            onValueChange={(value) =>
                              handleRoleChange(member.id, value as UserRole)
                            }
                            disabled={isPending}
                          >
                            {Object.values(UserRole).map((role) => (
                              <DropdownMenuRadioItem key={role} value={role}>
                                {role.charAt(0) + role.slice(1).toLowerCase()}
                              </DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    {/* --- Ban / Unban --- */}
                    {member.user.banned ? (
                      <DropdownMenuItem
                        className="text-green-600 focus:text-green-700"
                        onClick={() => handleUnban(member)}
                        disabled={isPending}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Unban Member
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-700"
                        onSelect={(e) => {
                          e.preventDefault(); // Prevent closing menu immediately
                          setMemberToBan(member);
                          setBanDialogOpen(true);
                        }}
                        disabled={isPending} // Also disable if an action is pending
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Ban Member
                      </DropdownMenuItem>
                    )}
                    {/* Add More Actions - e.g., View Details, Remove Member (careful!) */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {members.length === 0 && (
        <p className="p-6 text-center text-muted-foreground">
          No members found in this organization.
        </p>
      )}
    </CardContent>
  );
}
