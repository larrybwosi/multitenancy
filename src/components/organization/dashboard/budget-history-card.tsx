import { Card } from "@/components/ui/card"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

interface BudgetHistoryCardProps {
  data: Array<{
    id: string
    budgetNo: string
    budgetedAmount: number
    actualAmount: number
    date: string
  }>
}

export function BudgetHistoryCard({ data }: BudgetHistoryCardProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Budget history</h3>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="pb-2 font-medium">S/N</th>
              <th className="pb-2 font-medium">Budget No.</th>
              <th className="pb-2 font-medium">Budgeted Amount ($)</th>
              <th className="pb-2 font-medium">Actual Amount ($)</th>
              <th className="pb-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((budget) => (
              <tr key={budget.id} className="border-b last:border-b-0">
                <td className="py-3 text-sm">{budget.id}</td>
                <td className="py-3 text-sm">{budget.budgetNo}</td>
                <td className="py-3 text-sm">{formatCurrency(budget.budgetedAmount)}</td>
                <td className="py-3 text-sm">{formatCurrency(budget.actualAmount)}</td>
                <td className="py-3 text-sm">{budget.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
