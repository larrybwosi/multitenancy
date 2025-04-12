import { Card } from "@/components/ui/card"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PaymentVouchersCardProps {
  data: Array<{
    id: string
    subject: string
    date: string
    status: string
  }>
}

export function PaymentVouchersCard({ data }: PaymentVouchersCardProps) {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Payment vouchers</h3>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="pb-2 font-medium">S/N</th>
              <th className="pb-2 font-medium">Subject</th>
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((voucher) => (
              <tr key={voucher.id} className="border-b last:border-b-0">
                <td className="py-3 text-sm">{voucher.id}</td>
                <td className="py-3 text-sm">{voucher.subject}</td>
                <td className="py-3 text-sm">{voucher.date}</td>
                <td className="py-3 text-sm">
                  <StatusBadge status={voucher.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        status === "Pending" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
        status === "Approved" && "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
      )}
    >
      {status}
    </Badge>
  )
}
