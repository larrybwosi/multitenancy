import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FinancialSummary } from "@/types/finance"
import { formatCurrency } from "@/lib/utils"

interface FinancialSummaryCardsProps {
  data: FinancialSummary
}

export function FinancialSummaryCards({ data }: FinancialSummaryCardsProps) {
  const cards = [
    {
      title: "Total Revenue",
      value: data.totalRevenue,
      description: "Total income for the period",
    },
    {
      title: "Total Expenses",
      value: data.totalExpenses,
      description: "Total expenses for the period",
    },
    {
      title: "Net Income",
      value: data.netIncome,
      description: "Revenue minus expenses",
    },
    {
      title: "Cash Balance",
      value: data.cashBalance,
      description: "Current available cash",
    },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(card.value)}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
