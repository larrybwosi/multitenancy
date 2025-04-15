"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MembersList } from "./members-list"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import Link from "next/link"

export function MembersPage() {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<any[]>([])

  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch("/api/members/test")
        const data = await response.json()
        setMembers(data.members)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching members:", error)
        // Keep loading state true to show skeletons
      }
    }

    fetchMembers()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Organization Members</h1>
          <p className="text-muted-foreground">Manage your organization's team members and their roles</p>
        </div>
        <Button asChild>
          <Link href="/organization/invite">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            View and manage all members of your organization. You can change roles or remove members as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MembersList loading={loading} members={members} />
        </CardContent>
      </Card>
    </div>
  )
}
