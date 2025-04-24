import { PosClientWrapper } from "./components/PosClientWrapper";
import { getPosData } from "./actions";

export default async function PosPage() {
  const { products, customers } = await getPosData();

  return (
    <PosClientWrapper products={products} customers={customers}/>
  );
}

// Disable caching for real-time data
export const dynamic = "force-dynamic";
