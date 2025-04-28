import { BulkRestockForm } from "@/components/inventory/bulk-restock-form"

export const metadata = {
  title: "Bulk Restock - Stock Management System",
  description: "Restock inventory from suppliers",
}

export default function BulkRestockPage() {
  return <BulkRestockForm />
}
