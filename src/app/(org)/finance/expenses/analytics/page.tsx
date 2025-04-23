import { ExpenseAnalyticsPage } from "@/components/organization/finance/expenses/expense-analytics-page"
import { Suspense } from "react"

export default function ExpenseAnalytics() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center">Loading...</div>}>
      <div className="flex flex-col gap-4">
        <ExpenseAnalyticsPage />
      </div>
    </Suspense>
  );
}
