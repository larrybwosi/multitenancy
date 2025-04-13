"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InviteMemberForm } from "./form"
import { useRouter } from "next/navigation"

export default function InvitePage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push("/invitations")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invite New Member</h1>
        <p className="text-muted-foreground">Send an invitation to join your organization</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
          <CardDescription>
            Fill out the form below to send an invitation to a new team member. They will receive an email with
            instructions to join your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  )
}
