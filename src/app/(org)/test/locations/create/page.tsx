import type { Metadata } from "next"
import { CreateLocationForm } from "@/components/create-location-form"

export const metadata: Metadata = {
  title: "Create Location - Schedule Management System",
  description: "Create a new location for your organization",
}

export default function CreateLocationPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create Location</h1>
      </div>
      <CreateLocationForm />
    </div>
  )
}
