import type { Metadata } from "next"
// import { CalendarView } from "@/components/text/calendar-view"

export const metadata: Metadata = {
  title: "Calendar - Schedule Management System",
  description: "View your schedules in a calendar format",
}

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
      </div>
      {/* <CalendarView /> */}
    </div>
  )
}
