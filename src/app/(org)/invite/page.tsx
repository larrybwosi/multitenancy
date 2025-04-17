"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InviteMemberForm } from "./form"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { useSession } from "@/lib/auth/authClient"
import useSWR from "swr"
import { getOrganizationById } from "@/actions/organization"

export default function InvitePage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push("/invitations")
  }

  const {data: session } = useSession()
  console.log("Session in InvitePage:", session)

    const { data: organization, error, isLoading } = useSWR(
      "organization",
      async ()=>getOrganizationById(session?.session.activeOrganizationId || ''),
      {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minute
      }
    );
if (isLoading) return <div>Loading...</div>
if (error) return <div>Error loading organization</div>
  if (!organization) return <div>No organization found</div>
  console.log("Organization in InvitePage:", organization)

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
          <InviteMemberForm onSuccess={handleSuccess} organizationName={organization?.name} inviterName={session?.user?.name || ''}/>
        </CardContent>
      </Card>
    </div>
  );
}
