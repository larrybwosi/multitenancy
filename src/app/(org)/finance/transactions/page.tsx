import { TransactionsPage } from "@/components/organization/finance/transactions/transactions-page"
import { Suspense } from "react"

export default function Transactions() {
  return(
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center">Loading...</div>}>
      <div className="flex flex-col gap-4">
        <TransactionsPage />
      </div>
    </Suspense>
  )
}
 