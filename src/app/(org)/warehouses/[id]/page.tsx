import { WarehouseDetailsPage } from "@/components/organization/warehouse/warehouse-details-page"

export default function WarehouseDetails({ params }: { params: { id: string } }) {
  return <WarehouseDetailsPage id={params.id} />
}
