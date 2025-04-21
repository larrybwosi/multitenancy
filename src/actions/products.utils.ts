'use server';
import { db } from "@/lib/db";

async function getProductStock(
  productId: string,
  variantId?: string,
  locationId?: string
) {
  return await db.productVariantStock.findMany({
    where: {
      productId,
      variantId: variantId || undefined,
      locationId: locationId || undefined,
    },
    include: {
      location: true,
      variant: true,
    },
  });
}

async function getStockHistory(productId: string, variantId?: string, locationId?: string) {
  return await db.stockMovement.findMany({
    where: {
      productId,
      variantId: variantId || undefined,
      OR: [
        { fromLocationId: locationId },
        { toLocationId: locationId }
      ]
    },
    orderBy: {
      movementDate: 'desc'
    },
    include: {
      fromLocation: true,
      toLocation: true,
      member: true
    }
  });
}


export { getProductStock, getStockHistory };