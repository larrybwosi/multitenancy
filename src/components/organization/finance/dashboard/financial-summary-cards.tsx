import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDownIcon, ArrowUpIcon, DollarSign, CreditCard, Wallet, BarChart } from "lucide-react"

interface FinancialSummaryCardsProps {
  data: {
    totalRevenue: number
    totalExpenses: number
    netProfit: number
    cashOnHand: number
    accountsReceivable: number
    accountsPayable: number
  }
}

export function FinancialSummaryCards({ data }: FinancialSummaryCardsProps) {
  if (!data) return null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const profitPercentage = ((data.netProfit / data.totalRevenue) * 100).toFixed(1)
  const isProfitPositive = data.netProfit > 0

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
          <p className="text-xs text-muted-foreground">For the current period</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">For the current period</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.netProfit)}</div>
          <div className="flex items-center">
            {isProfitPositive ? (
              <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
            )}
            <p className={`text-xs ${isProfitPositive ? "text-green-500" : "text-red-500"}`}>
              {profitPercentage}% profit margin
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Cash on Hand</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.cashOnHand)}</div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <div>Receivable: {formatCurrency(data.accountsReceivable)}</div>
            <div>Payable: {formatCurrency(data.accountsPayable)}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
