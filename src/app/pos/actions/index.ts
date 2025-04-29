import { getServerAuthContext } from "@/actions/auth";
import { db } from "@/lib/db";
import redis from "@/lib/redis";
import { Customer, Product } from "@prisma/client";
const CACHE_TTL = 60 * 60; // 1 hour

export async function getPosData(): Promise<{
  products: Product[];
  customers: Customer[];
}> {
  const { organizationId } = await getServerAuthContext();
  
  const CACHE_KEY = `pos-data:${organizationId}`;
  // Try cache first
  const cached = await redis.get(CACHE_KEY);
  if (cached) return cached as { products: Product[]; customers: Customer[] };

  try {
    // Fetch fresh data
    const data = await fetchFreshPosData();

    // Cache with TTL
    await redis.setex(CACHE_KEY, CACHE_TTL, data);

    return data;
  } catch (error) {
    console.error("Error fetching POS data:", error);
    return { products: [], customers: [] };
  }
}

async function fetchFreshPosData() {
  const {organizationId} = await getServerAuthContext();
  const [productsData, customersData] = await Promise.all([
    db.product.findMany({
      where: { isActive: true, organizationId },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        basePrice: true,
        imageUrls: true,
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            priceModifier: true,
            attributes: true,
            isActive: true,
            reorderPoint: true,
            reorderQty: true,
            lowStockAlert: true,
          },
        }
      },
      orderBy: { name: "asc" },
    }),
    db.customer.findMany({
      where: { isActive: true, organizationId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    products: productsData.map((p) => ({
      ...p,
      basePrice: p.basePrice.toString(),
      imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [],
    })),
    customers: customersData,
  };
}

// Call this when data changes to invalidate cache
export async function invalidatePosDataCache(organizationId: string) {
  console.log('Revalidating data cache...')
  const CACHE_KEY = `pos-data:${organizationId}`;
  await redis.del(CACHE_KEY);
}
