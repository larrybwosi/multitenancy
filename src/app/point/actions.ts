'use server'
import { db } from "@/lib/db";
import { Product } from "@prisma/client";



export async function getDbProducts(): Promise<Product[]> {
  try {
    const dbProducts = await db.product.findMany({
      where: {
        isActive: true, // Only fetch active products
      },
      include: {
        variants: {
          where: {
            isActive: true, // Only include active variants
          },
          orderBy: {
            // Optional: Define an order, e.g., by name or creation date
            name: "asc",
          },
        },
        // category: { select: { name: true } } // Optionally include category name
      },
      orderBy: {
        name: "asc", // Order products by name
      },
    });

    // Map Prisma types (with Decimal) to frontend types (with number)
    const products: Product[] = dbProducts.map((dbProduct) => ({
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description, // Keep null if null
      sku: dbProduct.sku,
      barcode: dbProduct.barcode, // Keep null if null
      categoryId: dbProduct.categoryId,
      // category: dbProduct.category ? { name: dbProduct.category.name } : undefined,
      basePrice: Number(dbProduct.basePrice), // Convert Decimal to number
      reorderPoint: dbProduct.reorderPoint,
      isActive: dbProduct.isActive,
      imageUrls: dbProduct.imageUrls,
      variants: dbProduct.variants.map((dbVariant) => ({
        id: dbVariant.id,
        productId: dbVariant.productId,
        name: dbVariant.name,
        sku: dbVariant.sku,
        barcode: dbVariant.barcode, // Keep null if null
        priceModifier: Number(dbVariant.priceModifier), // Convert Decimal to number
        // Ensure attributes are correctly handled. Prisma's Json might need parsing
        // depending on setup, but often comes pre-parsed. Asserting type here.
        attributes: dbVariant.attributes as Record<string, string>,
        isActive: dbVariant.isActive,
      })),
    }));

    return products;
  } catch (error) {
    console.error("Database Error: Failed to fetch products.", error);
    // In a real app, you might want to throw a more specific error
    // or return an object indicating failure.
    throw new Error("Failed to fetch products.");
  }
  // Note: Prisma Client doesn't strictly need manual disconnection in serverless/edge
  // environments or typical web request lifecycles, but might be needed
  // in long-running scripts. Here we assume it's managed elsewhere or not needed per request.
}

// Optional: Fetch single product (if needed elsewhere)
export async function getDbProductById(id: string): Promise<Product | null> {
  try {
    const dbProduct = await db.product.findUnique({
      where: { id: id, isActive: true },
      include: {
        variants: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
        // category: { select: { name: true } }
      },
    });

    if (!dbProduct) return null;

    // Map to frontend type
    const product: Product = {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description,
      sku: dbProduct.sku,
      barcode: dbProduct.barcode,
      categoryId: dbProduct.categoryId,
      basePrice: Number(dbProduct.basePrice),
      reorderPoint: dbProduct.reorderPoint,
      isActive: dbProduct.isActive,
      imageUrls: dbProduct.imageUrls,
      variants: dbProduct.variants.map((dbVariant) => ({
        id: dbVariant.id,
        productId: dbVariant.productId,
        name: dbVariant.name,
        sku: dbVariant.sku,
        barcode: dbVariant.barcode,
        priceModifier: Number(dbVariant.priceModifier),
        attributes: dbVariant.attributes as Record<string, string>,
        isActive: dbVariant.isActive,
      })),
    };
    return product;
  } catch (error) {
    console.error(
      `Database Error: Failed to fetch product with ID ${id}.`,
      error
    );
    throw new Error("Failed to fetch product.");
  }
}
