import { CalendarIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Payment {
  id: string
  description: string
  amount: number
  dueDate: string
}

interface UpcomingPaymentsTableProps {
  payments: Payment[]
}

export function UpcomingPaymentsTable({ payments }: UpcomingPaymentsTableProps) {
  if (!payments || payments.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No upcoming payments</p>
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

  const getDaysRemaining = (dateString: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(dateString)
    dueDate.setHours(0, 0, 0, 0)

    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const getStatusBadge = (daysRemaining: number) => {
    if (daysRemaining < 0) {
      return <Badge variant="destructive">Overdue</Badge>
    } else if (daysRemaining <= 3) {
      return <Badge variant="destructive">Due Soon</Badge>
    } else if (daysRemaining <= 7) {
      return <Badge variant="warning">Upcoming</Badge>
    } else {
      return <Badge variant="outline">Scheduled</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b bg-muted/50 transition-colors">
                <th className="h-10 px-4 text-left font-medium">Description</th>
                <th className="h-10 px-4 text-left font-medium">Due Date</th>
                <th className="h-10 px-4 text-right font-medium">Amount</th>
                <th className="h-10 px-4 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => {
                const daysRemaining = getDaysRemaining(payment.dueDate)
                return (
                  <tr key={payment.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{payment.description}</td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center">
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(payment.dueDate)}
                      </div>
                    </td>
                    <td className="p-4 align-middle text-right">{formatCurrency(payment.amount)}</td>
                    <td className="p-4 align-middle text-right">{getStatusBadge(daysRemaining)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="outline" size="sm">
          Manage Payments
        </Button>
      </div>
    </div>
  )
}
