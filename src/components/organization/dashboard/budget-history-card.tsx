import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

type BudgetData = {
  name: string
  amount: number
  amountUsed: number
  periodStart: string
  periodEnd: string
}

interface BudgetHistoryCardProps {
  data: BudgetData[]
}

export function BudgetHistoryCard({ data }: BudgetHistoryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((budget) => {
            const percentage = Math.round((budget.amountUsed / budget.amount) * 100)
            const periodStartDate = new Date(budget.periodStart).toLocaleDateString()
            const periodEndDate = new Date(budget.periodEnd).toLocaleDateString()

            return (
              <div key={budget.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{budget.name}</p>
                    <p className="text-sm text-gray-500">
                      {periodStartDate} - {periodEndDate}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${budget.amountUsed.toLocaleString()} / ${budget.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">{percentage}% used</p>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
