import { SupplierDetails } from "@/components/suppliers/supplier-details"

interface SupplierPageProps {
  params: {
    id: string
  }
}

export default function SupplierPage({ params }: SupplierPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Supplier Details</h1>
      <SupplierDetails supplierId={params.id} />
    </div>
  )
}
