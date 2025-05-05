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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  MoreHorizontal, Search, UserMinus, UserCog, 
  Mail, ShieldAlert, ShieldCheck, Activity,
  CheckCircle, XCircle, Clock, AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  Sheet, SheetContent, SheetDescription, 
  SheetHeader, SheetTitle 
} from "@/components/ui/sheet"
import { format } from "date-fns"
import { MemberRole } from "@/lib/types"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Member } from "@/prisma/client"

interface MembersListProps {
  loading: boolean
  members: MemberWithUserRelationship[]
}
interface MemberWithUserRelationship extends Member {
  user: {
    email: string,
    name: string,
    banned: boolean
  }
}

export function MembersList({ loading, members }: MembersListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleChangeOpen, setRoleChangeOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MemberWithUserRelationship | null>(null)
  const [newRole, setNewRole] = useState<string>("")
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<MemberWithUserRelationship | null>(null)
  const [banDialogOpen, setBanDialogOpen] = useState(false)
  const [banReason, setBanReason] = useState("")
  const [banExpiry, setBanExpiry] = useState("")
  const [memberToBan, setMemberToBan] = useState<MemberWithUserRelationship | null>(null)
  const [activitySheetOpen, setActivitySheetOpen] = useState(false)
  const [activityMember, setActivityMember] = useState<MemberWithUserRelationship | null>(null)
  const [memberActivity, setMemberActivity] = useState<MemberWithUserRelationship | null>(null)
  const [loadingActivity, setLoadingActivity] = useState(false)
  
  const filteredMembers = members.filter(
    (member) =>
      member.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/members/${memberId}`, { 
        method: 'DELETE' 
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to remove member")
      }
      
      toast.success("Member removed", {
        description: `The member has been removed from the organization.`,
      })
      
      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      console.error("Error removing member:", error)
      toast.error("Failed to remove member", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update role")
      }
      
      toast.success("Role updated", {
        description: `Member role has been updated to ${newRole}.`,
      })
      
      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      console.error("Error updating role:", error)
      toast.error("Failed to update role", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }
  
  const handleBanMember = async (memberId: string, banned: boolean, reason?: string, expires?: string) => {
    try {
      const body: { banReason?: string; banExpires?: string } = { banned }
      
      if (banned && reason) {
        body.banReason = reason
      }
      
      if (banned && expires) {
        body.banExpires = expires
      }
      
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update member ban status")
      }
      
      toast.success(banned ? "Member banned" : "Member unbanned", {
        description: banned 
          ? `Member has been banned from the platform.` 
          : `Member has been unbanned and can now access the platform.`,
      })
      
      // Refresh the page to update the list
      window.location.reload()
    } catch (error) {
      console.error("Error updating ban status:", error)
      toast.error("Failed to update ban status", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    }
  }
  
  const fetchMemberActivity = async (memberId: string) => {
    setLoadingActivity(true)
    try {
      const response = await fetch(`/api/members/${memberId}/activity?limit=5`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch member activity")
      }
      
      setMemberActivity(data)
    } catch (error) {
      console.error("Error fetching member activity:", error)
      toast.error("Failed to fetch member activity", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setLoadingActivity(false)
    }
  }
  
  const openActivitySheet = (member: MemberWithUserRelationship) => {
    setActivityMember(member)
    fetchMemberActivity(member.id)
    setActivitySheetOpen(true)
  }

  return (
    <>
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
                <TableHead>Status</TableHead>
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
                      <Skeleton className="h-6 w-[80px]" />
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
                    <TableCell>
                      <StatusBadge member={member} />
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
                          
                          <DropdownMenuItem onClick={() => openActivitySheet(member)}>
                            <Activity className="mr-2 h-4 w-4" />
                            <span>View Activity</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => (window.location.href = `mailto:${member.user.email}`)}>
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Email</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <UserCog className="mr-2 h-4 w-4" />
                              <span>Change Role</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup value={member.role} onValueChange={(value) => {
                                  setSelectedMember(member)
                                  setNewRole(value)
                                  setRoleChangeOpen(true)
                                }}>
                                  {Object.values(MemberRole).map((role) => (
                                    <DropdownMenuRadioItem key={role} value={role}>
                                      {role.charAt(0) + role.slice(1).toLowerCase()}
                                    </DropdownMenuRadioItem>
                                  ))}
                                </DropdownMenuRadioGroup>
                              </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                          </DropdownMenuSub>
                          
                          <DropdownMenuSeparator />
                          
                          {member.user.banned ? (
                            <DropdownMenuItem 
                              onClick={() => handleBanMember(member.id, false)}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              <span>Unban User</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setMemberToBan(member)
                                setBanReason("")
                                setBanExpiry("")
                                setBanDialogOpen(true)
                              }}
                            >
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              <span>Ban User</span>
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setMemberToDelete(member)
                              setConfirmDeleteOpen(true)
                            }}
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
                  <TableCell colSpan={6} className="h-24 text-center">
                    No members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Role Change Confirmation Dialog */}
      <Dialog open={roleChangeOpen} onOpenChange={setRoleChangeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the role of {selectedMember?.user.name} to {newRole?.charAt(0) + newRole?.slice(1).toLowerCase()}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleChangeOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                handleChangeRole(selectedMember?.id||"", newRole)
                setRoleChangeOpen(false)
              }}
            >
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {memberToDelete?.user.name} from the organization? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                handleRemoveMember(memberToDelete?.id || "")
                setConfirmDeleteOpen(false)
              }}
            >
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Ban Member Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              This will prevent {memberToBan?.user.name} from logging into the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="banReason">
                Reason for ban
              </label>
              <Textarea 
                id="banReason" 
                placeholder="Provide a reason for the ban" 
                value={banReason} 
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="banExpiry">
                Ban expiry (optional)
              </label>
              <Input 
                id="banExpiry" 
                type="datetime-local" 
                value={banExpiry} 
                onChange={(e) => setBanExpiry(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Leave blank for permanent ban</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                handleBanMember(memberToBan?.id, true, banReason, banExpiry)
                setBanDialogOpen(false)
              }}
            >
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Member Activity Sheet */}
      <Sheet open={activitySheetOpen} onOpenChange={setActivitySheetOpen}>
        <SheetContent className="sm:max-w-xl w-full">
          <SheetHeader>
            <SheetTitle>Member Activity - {activityMember?.user.name}</SheetTitle>
            <SheetDescription>
              Recent activity and performance details
            </SheetDescription>
          </SheetHeader>
          
          <div className="py-6 space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Member Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={activityMember?.user.image || ''} alt={activityMember?.user.name} />
                    <AvatarFallback>
                      {activityMember?.user.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{activityMember?.user.name}</p>
                    <p className="text-sm text-muted-foreground">{activityMember?.user.email}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <RoleBadge role={activityMember?.role} />
                      <StatusBadge member={activityMember} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Stats Cards */}
            {loadingActivity ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-[100px]" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-6 w-[80px]" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : memberActivity ? (
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{memberActivity.statistics.totalSales}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      ${memberActivity.statistics.totalRevenue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Sale Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      ${memberActivity.statistics.averageSaleValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Items Sold</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{memberActivity.statistics.totalItemsSold}</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No activity data available
                </CardContent>
              </Card>
            )}
            
            {/* Recent Sales */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Sales</CardTitle>
                <CardDescription>The last 5 sales processed by this member</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActivity ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center border-b pb-2">
                        <div className="space-y-1">
                          <Skeleton className="h-5 w-[120px]" />
                          <Skeleton className="h-4 w-[80px]" />
                        </div>
                        <Skeleton className="h-6 w-[60px]" />
                      </div>
                    ))}
                  </div>
                ) : memberActivity?.recentSales?.length > 0 ? (
                  <div className="space-y-4">
                    {memberActivity.recentSales.map((sale: any) => (
                      <div key={sale.id} className="flex justify-between items-center border-b pb-2">
                        <div className="space-y-1">
                          <p className="font-medium">Sale #{sale.saleNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {sale.customer ? sale.customer.name : "No customer"} - 
                            {format(new Date(sale.saleDate), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                        <p className="font-medium">
                          ${sale.finalAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6">No recent sales</p>
                )}
              </CardContent>
            </Card>
            
            {/* Audit Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Logs</CardTitle>
                <CardDescription>Recent actions performed by this member</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActivity ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center border-b pb-2">
                        <div className="space-y-1">
                          <Skeleton className="h-5 w-[120px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                        <Skeleton className="h-4 w-[80px]" />
                      </div>
                    ))}
                  </div>
                ) : memberActivity?.auditLogs?.length > 0 ? (
                  <div className="space-y-4">
                    {memberActivity.auditLogs.map((log: any) => (
                      <div key={log.id} className="flex justify-between items-center border-b pb-2">
                        <div className="space-y-1">
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-muted-foreground">{log.description}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(log.performedAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6">No activity logs</p>
                )}
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function RoleBadge({ role }: { role: string }) {
  const roleColors: Record<string, string> = {
    OWNER: "bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200",
    ADMIN: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200",
    MANAGER: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200",
    STAFF: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
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

function StatusBadge({ member }: { member: any }) {
  if (member.user.banned) {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">
        <XCircle className="mr-1 h-3 w-3" />
        Banned
      </Badge>
    )
  }
  
  if (!member.isActive) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200">
        <AlertCircle className="mr-1 h-3 w-3" />
        Inactive
      </Badge>
    )
  }
  
  return (
    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
      <CheckCircle className="mr-1 h-3 w-3" />
      Active
    </Badge>
  )
}
