"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EditOrganizationForm } from "./edit-organization-form"
import { useRouter } from "next/navigation"

export function SettingsPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push("/organization/dashboard")
  }

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
          <EditOrganizationForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  )
}
