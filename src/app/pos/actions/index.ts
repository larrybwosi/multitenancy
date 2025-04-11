import { db } from "@/lib/db";
import { Customer, Product } from "@prisma/client";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL,
  token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN,
});

const CACHE_KEY = "pos_data";
const CACHE_TTL = 60 * 60; // 1 hour

export async function getPosData(): Promise<{
  products: Product[];
  customers: Customer[];
}> {
  // Try cache first
  const cached = await redis.get(CACHE_KEY);
  if (cached) return cached;

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
  const [productsData, customersData] = await Promise.all([
    db.product.findMany({
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
    db.customer.findMany({
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
export async function invalidatePosDataCache() {
  await redis.del(CACHE_KEY);
}
