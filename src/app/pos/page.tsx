import { PosClientWrapper } from "./components/PosClientWrapper";
import { getPosData } from "./actions";

export default async function PosPage() {
  const { products, customers } = await getPosData();

  const LCOCATION_ID = "cm9qk68f30009bka0d7y0hqhd";
  return (
    <PosClientWrapper products={products} customers={customers} locationId={LCOCATION_ID} />
  );
}

// Disable caching for real-time data
export const dynamic = "force-dynamic";
