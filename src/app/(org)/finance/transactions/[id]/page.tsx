import { TransactionDetailsPage } from "@/components/organization/finance/transactions/transaction-details-page"

export default function TransactionDetails({ params }: { params: { id: string } }) {
  return <TransactionDetailsPage id={params.id} />
}
