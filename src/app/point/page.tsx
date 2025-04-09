import prisma from "@/lib/db";
import { PosClientWrapper } from "./components/PosClientWrapper";
import { Product, Customer } from "./types";

async function getPosData(): Promise<{ products: Product[]; customers: Customer[] }> {
  try {
    // Fetch active products and customers concurrently
    const [productsData, customersData] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          sku: true,
          barcode: true,
          basePrice: true,
          imageUrls: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.customer.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

    // Serialize Decimal values to strings
    const serializedProducts = productsData.map((p) => ({
      ...p,
      basePrice: p.basePrice.toString(),
      // Ensure imageUrls is always an array
      imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [],
    }));

    return { 
      products: serializedProducts, 
      customers: customersData 
    };
  } catch (error) {
    console.error("Error fetching POS data:", error);
    // Return empty arrays in case of error
    return { products: [], customers: [] };
  }
}

export default async function PosPage() {
  const { products, customers } = await getPosData();

  return (
    <PosClientWrapper products={products} customers={customers} />
  );
}

// Disable caching for real-time data
export const dynamic = "force-dynamic";
