"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MembersList } from "./list"
import { Button } from "@/components/ui/button"
import { UserPlus, Users, RefreshCw } from "lucide-react"
import Link from "next/link"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { Member } from "@prisma/client"
import { toast } from "sonner"

export default function MembersPage() {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/members")
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch members")
      }
      
      const data = await response.json()
      setMembers(data.members)
    } catch (error) {
      console.error("Error fetching members:", error)
      toast.error("Failed to fetch members", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchMembers()
    setRefreshing(false)
  }

  useEffect(() => {
    fetchMembers()
  }, [])

  return (
    <div className="space-y-6 container mx-auto py-6">
      <div className="flex justify-between items-center">
        <SectionHeader
          title="Organization Members"
          subtitle="Manage your organization's team members and their roles"
          icon={<Users className="h-8 w-8 text-yellow-500" />}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/invite">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            View and manage all members of your organization. You can change
            roles, ban members, or remove them as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersList loading={loading} members={members} />
        </CardContent>
      </Card>
    </div>
  );
}
