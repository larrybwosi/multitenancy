import { RecurringExpensesPage } from "@/components/organization/finance/expenses/recurring-expenses-page"
import { Suspense } from "react";

export default function RecurringExpenses() {
  return (
    <Suspense fallback={<div className="flex h-full w-full items-center justify-center">Loading...</div>}>
      <div className="flex flex-col gap-4">
        <RecurringExpensesPage />
      </div>
    </Suspense>
  );
}
