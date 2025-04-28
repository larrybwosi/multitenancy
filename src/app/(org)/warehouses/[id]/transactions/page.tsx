import { WarehouseTransactionsPage } from "@/components/organization/warehouse/warehouse-transactions-page"

export default async function WarehouseTransactions({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) {
    return <div>Invalid warehouse ID</div>
  }
  return <WarehouseTransactionsPage id={id} />
}
