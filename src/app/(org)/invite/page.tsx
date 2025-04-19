import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InviteMemberForm } from "./form"
import { UserPlus } from "lucide-react"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { getServerAuthContext } from "@/actions/auth"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db"

export default async function InvitePage() {
 const { organizationId } = await getServerAuthContext()
 const session = await auth.api.getSession({ headers: await headers() })
 const org = await db.organization.findUnique({where: {id: organizationId}, select: {name: true}})

  return (
    <div className="space-y-6 container p-4 mt-4">
      <SectionHeader
        title="Invite New Member"
        subtitle="Send an invitation to join your organization"
        icon={<UserPlus className="h-8 w-8 text-indigo-500" />}
      />

      <Card className="max-w-7xl mx-auto">
        <CardHeader>
          <CardTitle>Invite Member</CardTitle>
          <CardDescription>
            Fill out the form below to send an invitation to a new team member.
            They will receive an email with instructions to join your
            organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteMemberForm organizationName={org?.name || ""} inviterName={session?.user?.name || ""} />
        </CardContent>
      </Card>
    </div>
  );
}
