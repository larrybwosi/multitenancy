// (e.g., in types/pos.ts)
import type {
  Product,
  Category as PrismaCategory,
  ProductVariant,
  Customer,
} from "@prisma/client"; // Assuming base Prisma types

// Category type from getCategories
export interface CategoryInfo
  extends Pick<PrismaCategory, "id" | "name" | "description" | "parentId"> {
  _count?: { products: number };
}

// Updated Variant type based on getProducts return structure
export interface VariantWithCalculatedStock
  extends Omit<ProductVariant, "priceModifier" | "attributes"> {
  priceModifier: string; // Price modifier is now a string
  totalStock: number; // Pre-calculated total stock
  attributes: any; // Keep attributes if they exist, adjust 'any' as needed
  // stockBatches is removed in the mapping, so it's not here
}

// Updated Product type based on getProducts return structure
export interface ProductWithCalculatedStock
  extends Omit<
    Product,
    "basePrice" | "variants" | "category" | "stockBatches" | "suppliers"
  > {
  basePrice: string; // Base price is now a string
  totalStock: number; // Pre-calculated total stock for the product (base + variants)
  category?: CategoryInfo | null; // Include structure from getProducts if category is included
  variants: VariantWithCalculatedStock[];
  // Add suppliers etc. if included and needed by the client
}

// Keep CartItem and CustomerSearchResult as previously defined,
// ensuring CartItem.price is handled correctly (calculated from string prices)
export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  productName: string;
  variantName?: string;
  price: number; // This will be calculated from string basePrice + string priceModifier
  quantity: number;
  imageUrls?: string[] | null;
  sku?: string | null;
}

export type CustomerSearchResult = Pick<
  Customer,
  "id" | "name" | "email" | "loyaltyPoints"
>;
