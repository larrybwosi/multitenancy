import type { Metadata } from "next"
import { CreateScheduleForm } from "@/components/create-schedule-form"

export const metadata: Metadata = {
  title: "Create Schedule - Schedule Management System",
  description: "Create a new schedule for your organization",
}

export default function CreateSchedulePage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Create Schedule</h1>
      </div>
      <CreateScheduleForm />
    </div>
  )
}
