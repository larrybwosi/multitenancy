import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExpenseStatus } from "@/prisma/client"
import { Badge } from "@/components/ui/badge"

type PaymentVoucher = {
  expenseNumber: string
  description: string
  amount: number
  expenseDate: string
  status: ExpenseStatus
}

interface PaymentVouchersCardProps {
  data: PaymentVoucher[]
}

export function PaymentVouchersCard({ data }: PaymentVouchersCardProps) {
  const getStatusColor = (status: ExpenseStatus) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-500"
      case "PENDING":
        return "bg-yellow-500"
      case "REJECTED":
        return "bg-red-500"
      case "PAID":
        return "bg-blue-500"
      case "REIMBURSED":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payment Vouchers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((voucher) => (
            <div
              key={voucher.expenseNumber}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <p className="font-medium">{voucher.description}</p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>{voucher.expenseNumber}</span>
                  <span>•</span>
                  <span>{new Date(voucher.expenseDate).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="font-semibold">
                  ${voucher.amount.toLocaleString()}
                </span>
                <Badge className={getStatusColor(voucher.status)}>
                  {voucher.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
