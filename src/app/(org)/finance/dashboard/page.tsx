import { FinanceDashboardPage } from "@/components/organization/finance/dashboard/finance-dashboard-page"
import { Suspense } from "react"

export default function FinanceDashboard() {
  <Suspense fallback={<div className="flex h-full w-full items-center justify-center">Loading...</div>}>
    <div className="flex flex-col gap-4">
      <FinanceDashboardPage />
    </div>
  </Suspense>
}
