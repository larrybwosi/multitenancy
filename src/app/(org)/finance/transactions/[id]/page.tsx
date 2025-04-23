import { TransactionDetailsPage } from "@/components/organization/finance/transactions/transaction-details-page"

export default async function TransactionDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <TransactionDetailsPage id={id} />
  )
}
