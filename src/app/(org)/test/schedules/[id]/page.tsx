import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ScheduleDetail } from "@/components/schedule-detail"

export const metadata: Metadata = {
  title: "Schedule Details - Schedule Management System",
  description: "View and manage schedule details",
}

export default function ScheduleDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Schedule Details</h1>
        <Link href={`/dashboard/schedules/${params.id}/items/create`}>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </Link>
      </div>
      <ScheduleDetail id={params.id} />
    </div>
  )
}
