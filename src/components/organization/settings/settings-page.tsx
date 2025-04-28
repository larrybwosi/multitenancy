"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EditOrganizationForm } from "./edit-organization-form"

export function SettingsPage() {

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization&apos;s details and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Organization</CardTitle>
          <CardDescription>Update your organization&apos;s details such as name, description, and logo.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditOrganizationForm/>
        </CardContent>
      </Card>
    </div>
  )
}
