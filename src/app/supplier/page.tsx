import { getSuppliers } from "@/actions/supplier";
import SupplierTable from "@/components/supplier/table";
import { PageHeader } from "@/components/ui/page-header";

export default async function SuppliersPage() {
  const suppliersResult = await getSuppliers(
    "r9UlQeTQL9UN0EVV8YOLTY7eRcTYnEu5"
  ); // TODO: Replace with actual org ID from auth/session

  if (!suppliersResult.success) {
    return <div>Error loading suppliers: {suppliersResult.error}</div>;
  }

  return (
    <div className="py-8 px-8 md:px-12 flex-1 max-w-[1800px] mx-auto">
      <div className="flex flex-col mb-8 space-y-3">
        <div className="flex items-center justify-between">
          <PageHeader
            title=" Suppliers Management"
            description="Manage your organization's suppliers and vendors. Add new suppliers, view their details, and track your purchasing history."
          />
        </div>
        <div className="h-1 w-24 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mt-2"></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <SupplierTable initialSuppliers={suppliersResult.data} />
      </div>
    </div>
  );
}
