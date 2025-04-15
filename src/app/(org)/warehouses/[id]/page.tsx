import { WarehouseDetailsPage } from "@/components/organization/warehouse/warehouse-details-page"

type Params = Promise<{ id: string }>;
export default async function WarehouseDetails({ params }: { params: Params }) {
  const {id} = await params
  return <WarehouseDetailsPage id={id} />
}
