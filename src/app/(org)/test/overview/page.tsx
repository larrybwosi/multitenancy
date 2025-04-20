import type { Metadata } from "next"
import { DashboardOverview } from "@/components/test/dashboard-overview"

export const metadata: Metadata = {
  title: "Dashboard - Schedule Management System",
  description: "Organization overview and key metrics",
}

export default function DashboardOverviewPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Organization Dashboard</h1>
      </div>
      <DashboardOverview />
    </div>
  )
}
