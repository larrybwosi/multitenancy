import type { Metadata } from "next"
import { LocationReports } from "@/components/location-reports"

export const metadata: Metadata = {
  title: "Location Reports - Schedule Management System",
  description: "View reports for your locations",
}

export default function LocationReportsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Location Reports</h1>
      </div>
      <LocationReports />
    </div>
  )
}
