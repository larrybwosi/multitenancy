import type { Metadata } from "next"
import { CreateScheduleItemForm } from "@/components/create-schedule-item-form"

export const metadata: Metadata = {
  title: "Create Schedule Item - Schedule Management System",
  description: "Add a new item to your schedule",
}

export default function CreateScheduleItemPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Add Schedule Item</h1>
      </div>
      <CreateScheduleItemForm scheduleId={params.id} />
    </div>
  )
}
