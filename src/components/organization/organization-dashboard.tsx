"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrganizationDetails } from "./organization-details"
import { MembersList } from "./members-list"
import { InvitationsList } from "./invitations-list"
import { InviteMemberForm } from "./invite-member-form"
import { EditOrganizationForm } from "./edit-organization-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function OrganizationDashboard() {
  const [activeTab, setActiveTab] = useState("details")

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Organization Administration</h1>

      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full mb-8">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
          <TabsTrigger value="invite">Invite</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>View your organization's information</CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationDetails />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Organization Members</CardTitle>
              <CardDescription>Manage your organization's members</CardDescription>
            </CardHeader>
            <CardContent>
              <MembersList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>Manage your organization's pending invitations</CardDescription>
            </CardHeader>
            <CardContent>
              <InvitationsList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invite">
          <Card>
            <CardHeader>
              <CardTitle>Invite New Member</CardTitle>
              <CardDescription>Send an invitation to join your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <InviteMemberForm onSuccess={() => setActiveTab("invitations")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit Organization</CardTitle>
              <CardDescription>Update your organization's details</CardDescription>
            </CardHeader>
            <CardContent>
              <EditOrganizationForm onSuccess={() => setActiveTab("details")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default OrganizationDashboard
