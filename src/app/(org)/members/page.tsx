"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MembersList } from "./list"
import { Button } from "@/components/ui/button"
import { UserPlus, Users, RefreshCw } from "lucide-react"
import Link from "next/link"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { useQueryState } from "nuqs"
import UserCreationModal from "./components/add-modal"
import { useMembers } from "@/lib/hooks/use-org"

export default function MembersPage() {
  const [refreshing, setRefreshing] = useState(false)
  const { data: members, isLoading: loading, refetch } = useMembers();
  const [isModalOpen, setIsModalOpen] = useQueryState('modal', {
    parse: v => v === 'true',
    serialize: v => (v ? 'true' : 'false'),
  });
    
  const handleRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  if(loading) {
    return
  }
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
            <Link href="/members?modal=true">
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
      <UserCreationModal isOpen={isModalOpen as boolean} onOpenChange={() => setIsModalOpen(false)} />
    </div>
  );
}
