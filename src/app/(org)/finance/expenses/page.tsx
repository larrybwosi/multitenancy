import { ExpensesOverview } from "@/components/organization/finance/expenses/expenses-overview"
import { Suspense } from "react"

export default function ExpensesPage() {
  return(
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center">Loading...</div>}>
      <div className="flex flex-col gap-4">
        <ExpensesOverview />
      </div>
    </Suspense>
  )
}
