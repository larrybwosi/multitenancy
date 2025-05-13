import {
  Prisma,
  Product,
  ProductVariant,
  ProductSupplier,
  Supplier,
  InventoryLocation,
} from '@/prisma/client';
import { getServerAuthContext } from './auth'; 
import { db } from '@/lib/db';
import { GetProductsOptions } from '@/lib/hooks/use-products';

// --- 2. Define the Enhanced Result Structure ---
// Make relations optional based on include flags
export type ProductWithDetails = Product & {
  retailPrice?: Prisma.Decimal | null;
  wholesalePrice?: Prisma.Decimal | null;
  buyingPrice?: Prisma.Decimal | null;
  category?: { id: string; name: string };
  variants?: (ProductVariant & { sellingPrice: Prisma.Decimal | null })[];
  // Include the supplier details via the junction table
  suppliers?: (ProductSupplier & { supplier: Supplier })[];
  defaultLocation?: InventoryLocation | null;
  reorderPoint?: number | null;
  sellingPrice?: Prisma.Decimal | null;
  totalStock?: number | null; // Total stock across all variants
};

// Updated main result structure
export interface GetProductsResult {
  data: ProductWithDetails[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  limit: number;
}

// --- 3. Refactored getProducts Function ---

/**
 * Fetches products for the current organization with enhanced options for including relations,
 * pagination, searching, filtering, and sorting.
 *
 * @param options - An object containing query parameters.
 * @returns An object containing the list of products, total count, and pagination details.
 */
export async function getProducts(
  options: GetProductsOptions = {} // Default to empty object
): Promise<GetProductsResult> {
  const { organizationId } = await getServerAuthContext();

  if (!organizationId) {
    throw new Error('User is not associated with an organization.');
  }

  // --- Destructure options with defaults ---
  const {
    includeVariants = true,
    includeCategory = true, 
    includeDefaultLocation = false,
    page = 1,
    limit = 10,
    search,
    categoryId,
    isActive,
    sortBy = 'createdAt', 
    sortOrder = 'desc', 
  } = options;

  // --- Calculate pagination ---
  const skip = (page - 1) * limit;
  const take = limit;

  // --- Build WHERE clause ---
  const whereClause: Prisma.ProductWhereInput = {
    organizationId, // Filter by the user's organization [cite: 38]
    ...(isActive !== undefined && { isActive: isActive }), // Filter by active status [cite: 30]
    ...(categoryId && { categoryId: categoryId }), // Filter by category [cite: 30]
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } }, // [cite: 30]
        { description: { contains: search, mode: 'insensitive' } }, // [cite: 30]
        { sku: { contains: search, mode: 'insensitive' } }, // [cite: 30]
        // Only search variant SKU if variants are potentially included or relevant
        { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } }, // [cite: 39]
      ],
    }),
  };

  // --- Build INCLUDE clause dynamically ---
  const includeClause: Prisma.ProductInclude = {};
  if (includeCategory) {
    includeClause.category = { select: { id: true, name: true } }; // [cite: 30]
  }
  if (includeVariants) {
    includeClause.variants = {
      // [cite: 32]
      where: {
        // Optionally filter included variants further if needed (e.g., isActive)
        isActive: true,
      },
      select: {
        id: true,
        productId: true,
        name: true,
        sku: true,
        barcode: true,
        attributes: true,
        isActive: true,
        reorderPoint: true,
        reorderQty: true,
        lowStockAlert: true,
        buyingPrice: true,
        wholesalePrice: true, // [cite: 40]
        retailPrice: true, // This is the selling price [cite: 41]
        createdAt: true,
        updatedAt: true,
      },
    };
  }
  
  if (includeDefaultLocation) {
    includeClause.defaultLocation = true; // Include the InventoryLocation object [cite: 37]
  }

  // --- Build ORDER BY clause ---
  const orderByClause: Prisma.ProductOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  };
  // Note: Sorting by variant price (e.g., retailPrice) directly here is complex
  // because a product can have multiple variants. You'd need a more specific
  // strategy if that's required (e.g., sort by min/max variant price,requires subquery or view).

  // --- Fetch data and count in parallel ---
  const [productsData, totalCount] = await db.$transaction([
    db.product.findMany({
      where: whereClause,
      include: includeClause,
      orderBy: orderByClause,
      skip: skip,
      take: take,
    }),
    db.product.count({ where: whereClause }),
  ]);

  //Get the total variant stock for each product
  
  const data: Promise<ProductWithDetails[]> = productsData.map(async product => {
    // Extract prices from the first variant (if it exists)
    const firstVariant = product.variants?.[0];
    const retailPrice = firstVariant?.retailPrice ?? null;
    const wholesalePrice = firstVariant?.wholesalePrice ?? null;
    const buyingPrice = firstVariant?.buyingPrice ?? null;
    const reorderPoint = firstVariant?.reorderPoint ?? null;

    const stockRecords = await db.productVariantStock.findMany({
      where: {
        productId: product.id,
      },
      select: {
        currentStock: true,
      },
    });

    // Sum the currentStock values
    const totalStock = stockRecords.reduce((sum, record) => sum + record.currentStock, 0);

    // Construct the final product object
    const productDetail: ProductWithDetails = {
      ...product, // Spread the base product fields
      sellingPrice: retailPrice,
      retailPrice,
      wholesalePrice,
      buyingPrice,
      reorderPoint,
      totalStock,
      // Conditionally include the full variants array ONLY if requested
      variants: includeVariants
        ? (product.variants?.map(variant => ({
            ...variant,
            // Ensure sellingPrice alias is added if full variants are included
            sellingPrice: variant.retailPrice,
          })) ?? []) // Use empty array if variants somehow weren't fetched but includeVariants was true
        : undefined, // Set variants to undefined if not requested
      // Remove the variants property fetched solely for price extraction if includeVariants is false
      ...(!includeVariants && { variants: undefined }),
    };

    // Clean up the temporary variants array if it was only for price extraction
    if (!includeVariants) {
      delete productDetail.variants; // Necessary because TS doesn't know we conditionally added/removed it
    }

    return productDetail;
  });

  // --- Calculate pagination details ---
  const totalPages = Math.ceil(totalCount / limit);

  // --- Return results ---
  return {
    data: await Promise.all(data), // Await the mapped promises to resolve
    totalCount,
    currentPage: page,
    totalPages,
    limit,
  };
}
