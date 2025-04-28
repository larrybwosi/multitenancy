import { StockTransferList } from "@/components/transfers/stock-transfer-list"
import { TransferActions } from "@/components/transfers/transfer-actions"

export const metadata = {
  title: "Stock Transfers - Stock Management System",
  description: "Manage stock transfers between warehouses",
}

export default function TransfersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Stock Transfers</h1>
        <TransferActions />
      </div>
      <StockTransferList />
    </div>
  )
}
