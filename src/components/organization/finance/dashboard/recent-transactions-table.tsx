import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Transaction {
  id: string
  description: string
  amount: number
  type: "income" | "expense"
  date: string
  category: string
}

interface RecentTransactionsTableProps {
  transactions: Transaction[]
}

export function RecentTransactionsTable({ transactions }: RecentTransactionsTableProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No transactions available</p>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b bg-muted/50 transition-colors">
                <th className="h-10 px-4 text-left font-medium">Description</th>
                <th className="h-10 px-4 text-left font-medium">Date</th>
                <th className="h-10 px-4 text-left font-medium">Category</th>
                <th className="h-10 px-4 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">{transaction.description}</td>
                  <td className="p-4 align-middle">{formatDate(transaction.date)}</td>
                  <td className="p-4 align-middle">
                    <Badge variant="outline">{transaction.category}</Badge>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex items-center justify-end">
                      {transaction.type === "income" ? (
                        <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownIcon className="mr-1 h-4 w-4 text-red-500" />
                      )}
                      <span className={transaction.type === "income" ? "text-green-500" : "text-red-500"}>
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href="/organization/finance/transactions">View All Transactions</Link>
        </Button>
      </div>
    </div>
  )
}
