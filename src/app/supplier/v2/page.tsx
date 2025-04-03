import { getSuppliers } from "@/actions/supplier";
import SupplierTable from "@/components/supplier/table";

export default async function SuppliersPage() {
  const suppliersResult = await getSuppliers("org_123"); // Replace with actual org ID from auth/session

  if (!suppliersResult.success) {
    return <div>Error loading suppliers: {suppliersResult.error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Suppliers
          </h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s suppliers and vendors
          </p>
        </div>
      </div>

      <SupplierTable initialSuppliers={suppliersResult.data} />
    </div>
  );
}
