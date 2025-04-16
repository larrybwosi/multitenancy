"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InviteMemberForm } from "./form"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
import { SectionHeader } from "@/components/ui/SectionHeader"

export default function InvitePage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push("/invitations")
  }

  return (
    <div className="space-y-6 container p-4 mt-4">
      <SectionHeader
        title="Invite New Member"
        subtitle="Send an invitation to join your organization"
        icon={<UserPlus className="h-8 w-8 text-indigo-500" />}
        // actionLabel="Invite Member"
        autoUpdate="2 min"
      />

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
          <CardDescription>
            Fill out the form below to send an invitation to a new team member.
            They will receive an email with instructions to join your
            organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
