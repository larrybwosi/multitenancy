import { WarehouseTransactionsPage } from "@/components/organization/warehouse/warehouse-transactions-page"

export default function WarehouseTransactions({ params }: { params: { id: string } }) {
  return <WarehouseTransactionsPage id={params.id} />
}
