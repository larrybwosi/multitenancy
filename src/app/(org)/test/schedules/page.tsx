import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { SchedulesList } from "@/components/schedules-list"

export const metadata: Metadata = {
  title: "Schedules - Schedule Management System",
  description: "Manage your schedules and events",
}

export default function SchedulesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Schedules</h1>
        <Link href="/dashboard/schedules/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Schedule
          </Button>
        </Link>
      </div>
      <SchedulesList />
    </div>
  )
}
