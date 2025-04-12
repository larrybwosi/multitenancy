"use client"

import { useState, useEffect } from "react"
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
import { MoreHorizontal, Search, RefreshCw, XCircle, Mail } from "lucide-react"
import { mockInvitations } from "@/lib/mock-data"

export function InvitationsList() {
  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      // In a real app, you would fetch from your API
      // const response = await fetch('/api/organization/invitations');
      // const data = await response.json();

      // Using mock data for demonstration
      setTimeout(() => {
        setInvitations(mockInvitations)
        setLoading(false)
      }, 1000)
    }

    fetchData()
  }, [])

  const filteredInvitations = invitations.filter(
    (invitation) =>
      invitation.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invitation.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invitation.status.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleCancelInvitation = (invitationId: string) => {
    // In a real app, you would call your API
    // await fetch(`/api/organization/invitations/${invitationId}`, { method: 'DELETE' });

    // For demo, just remove from state
    setInvitations(invitations.filter((invitation) => invitation.id !== invitationId))
  }

  const handleResendInvitation = (invitationId: string) => {
    // In a real app, you would call your API
    // await fetch(`/api/organization/invitations/${invitationId}/resend`, { method: 'POST' });

    // For demo, just update state
    setInvitations(
      invitations.map((invitation) =>
        invitation.id === invitationId
          ? {
              ...invitation,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }
          : invitation,
      ),
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search invitations..."
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
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-6 w-[200px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-[100px]" />
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
            ) : filteredInvitations.length > 0 ? (
              filteredInvitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">{invitation.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={invitation.role || "EMPLOYEE"} />
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
                        <DropdownMenuItem onClick={() => (window.location.href = `mailto:${invitation.email}`)}>
                          <Mail className="mr-2 h-4 w-4" />
                          <span>Email</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleResendInvitation(invitation.id)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          <span>Resend</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleCancelInvitation(invitation.id)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          <span>Cancel</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No invitations found.
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
    OWNER: "bg-amber-100 text-amber-800 hover:bg-amber-200",
    MANAGER: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    EMPLOYEE: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    CASHIER: "bg-purple-100 text-purple-800 hover:bg-purple-200",
    VIEWER: "bg-gray-100 text-gray-800 hover:bg-gray-200",
  }

  const colorClass = roleColors[role] || "bg-gray-100 text-gray-800 hover:bg-gray-200"

  return (
    <Badge variant="outline" className={`font-medium ${colorClass}`}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </Badge>
  )
}

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    ACCEPTED: "bg-green-100 text-green-800 hover:bg-green-200",
    EXPIRED: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    REJECTED: "bg-red-100 text-red-800 hover:bg-red-200",
  }

  const colorClass = statusColors[status] || "bg-gray-100 text-gray-800 hover:bg-gray-200"

  return (
    <Badge variant="outline" className={`font-medium ${colorClass}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  )
}
