"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvitationsList } from "./invitations-list"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import Link from "next/link"

export function InvitationsPage() {
  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<any[]>([])

  useEffect(() => {
    async function fetchInvitations() {
      try {
        const response = await fetch("/api/organization/invitations")
        const data = await response.json()
        setInvitations(data.invitations)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching invitations:", error)
        // Keep loading state true to show skeletons
      }
    }

    fetchInvitations()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Pending Invitations</h1>
          <p className="text-muted-foreground">Manage your organization's pending invitations</p>
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
          <CardTitle>Invitations</CardTitle>
          <CardDescription>
            View and manage all pending invitations to your organization. You can resend or cancel invitations as
            needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvitationsList loading={loading} invitations={invitations} />
        </CardContent>
      </Card>
    </div>
  )
}
