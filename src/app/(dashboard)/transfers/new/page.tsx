import { CreateTransferForm } from "@/components/transfers/create-transfer-form"

export const metadata = {
  title: "New Stock Transfer - Stock Management System",
  description: "Create a new stock transfer between locations",
}

export default function NewTransferPage() {
  return <CreateTransferForm />
}
