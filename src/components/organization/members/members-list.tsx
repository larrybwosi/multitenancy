"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MoreHorizontal, Search, UserMinus, UserCog, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

interface MembersListProps {
  loading: boolean
  members: any[]
}

export function MembersList({ loading, members }: MembersListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMembers = members.filter(
    (member) =>
      member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleRemoveMember = (memberId: string, memberName: string) => {
    // In a real app, you would call your API
    // await fetch(`/api/organization/members/${memberId}`, { method: 'DELETE' });

    toast({
      title: "Member removed",
      description: `${memberName} has been removed from the organization.`,
    })
  }

  const handleChangeRole = (memberId: string, newRole: string) => {
    // In a real app, you would call your API
    // await fetch(`/api/organization/members/${memberId}`, {
    //   method: 'PATCH',
    //   body: JSON.stringify({ role: newRole })
    // });

    // toast({
    //   title: "Role updated",
    //   description: `Member role has been updated to ${newRole}.`,
    // })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search members..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-6 w-[150px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.user.name}</TableCell>
                  <TableCell>{member.user.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={member.role} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(member.createdAt).toLocaleDateString()}
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
                        <DropdownMenuItem onClick={() => (window.location.href = `mailto:${member.user.email}`)}>
                          <Mail className="mr-2 h-4 w-4" />
                          <span>Email</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <UserCog className="mr-2 h-4 w-4" />
                          <span>Change Role</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleRemoveMember(member.id, member.user.name)}
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          <span>Remove</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const roleColors: Record<string, string> = {
    OWNER: "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200",
    MANAGER: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200",
    EMPLOYEE: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
    CASHIER: "bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200",
    VIEWER: "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200",
  }

  const colorClass = roleColors[role] || "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"

  return (
    <Badge variant="outline" className={cn("font-medium", colorClass)}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </Badge>
  )
}
