/**
 * Server actions for managing Suppliers.
 * Includes CRUD operations and fetching supplier-related data like purchase history.
 * Incorporates Zod validation, improved error handling, pagination, search, and filtering.
 */
'use server';

import { z } from 'zod';
import { db } from '@/lib/db'; // Adjust path if needed
import { Supplier, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { ActionResponse, } from '@/lib/types/suppliers'; // Assuming these types exist
import { getServerAuthContext } from './auth'; // Assuming auth context helper
import {
  CreateSupplierPayload,
  CreateSupplierPayloadSchema,
  DeleteSupplierPayload,
  DeleteSupplierPayloadSchema,
  UpdateSupplierPayload,
  UpdateSupplierPayloadSchema,
} from '@/lib/validations/suppliers';

// --- Helper Functions ---

/**
 * Handles common error patterns and returns a standardized ActionResponse error.
 * @param error - The error object caught.
 * @param context - A string describing the action being performed (e.g., "creating supplier").
 * @returns ActionResponse<never> - Always returns a failure response.
 */
async function handleActionError(error: unknown, context: string): ActionResponse<never> {
  console.error(`Error ${context}:`, error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        const target = (error.meta?.target as string[])?.join(', ') || 'field';
        return {
          success: false,
          error: `A supplier with this ${target} already exists.`,
          errorCode: error.code,
        };
      case 'P2025': // Record not found
        return {
          success: false,
          error: 'Supplier not found or access denied.',
          errorCode: error.code,
        };
      case 'P2014': // Required relation violation (on delete)
      case 'P2003': // Foreign key constraint failure (on delete)
        return {
          success: false,
          error: 'Cannot delete supplier: It is linked to other records (e.g., Purchase Orders).',
          errorCode: error.code,
        };
      default:
        return {
          success: false,
          error: `Database error (${error.code}) while ${context}.`,
          errorCode: error.code,
        };
    }
  } else if (error instanceof z.ZodError) {
    // Handle Zod validation errors
    return {
      success: false,
      error: 'Invalid input.',
      details: error.format(),
      errorCode: 'VALIDATION_ERROR',
    };
  } else if (error instanceof Error) {
    // Handle standard errors (including potential auth errors)
    if (error.message.startsWith('Access Denied') || error.message.includes('not found')) {
      return {
        success: false,
        error: 'Supplier not found or access denied.',
        errorCode: 'NOT_FOUND_OR_ACCESS_DENIED',
      };
    }
    return {
      success: false,
      error: `Failed to ${context.split(' ')[0]} supplier: ${error.message}`,
      errorCode: 'GENERIC_ERROR',
    };
  } else {
    // Handle unknown errors
    return {
      success: false,
      error: `An unknown error occurred while ${context}.`,
      errorCode: 'UNKNOWN_ERROR',
    };
  }
}
// --- CRUD Actions ---

/**
 * Creates a new supplier for the current organization.
 * @param input - The supplier data payload.
 * @returns ActionResponse containing the created supplier or an error.
 */
export async function createSupplier(input: CreateSupplierPayload): Promise<ActionResponse<Supplier>> {
  try {
    const { organizationId } = await getServerAuthContext(); // Throws if unauthorized

    // Validate input payload
    const validation = CreateSupplierPayloadSchema.safeParse(input);
    if (!validation.success) {
      console.error('Validation error:', validation.error.flatten().fieldErrors);
      return {
        success: false,
        error: 'Invalid input.',
        details: validation.error.format(),
      };
    }

    const { name, email, customFields, ...restData } = validation.data;

    const customFieldsString = JSON.stringify(customFields);

    // Manually check for unique constraints *before* attempting creation
    // Check name uniqueness within the organization [cite: 42]
    const existingName = await db.supplier.findUnique({
      where: { organizationId_name: { organizationId, name } },
      select: { id: true }, // Select only needed field
    });
    if (existingName) {
      return {
        success: false,
        error: `Supplier with name "${name}" already exists.`,
      };
    }

    // Check email uniqueness within the organization if provided (schema doesn't enforce uniqueness) [cite: 42]
    if (email) {
      const existingEmail = await db.supplier.findFirst({
        where: { organizationId, email },
        select: { id: true },
      });
      if (existingEmail) {
        return {
          success: false,
          error: `Supplier with email "${email}" already exists.`,
        };
      }
    }

    // Create the supplier
    const newSupplier = await db.supplier.create({
      data: {
        ...restData,
        name,
        email,
        customFields: customFieldsString,
        organizationId: organizationId, // Assign to the correct organization
      },
    });

    // Revalidate cache paths
    revalidatePath(`/suppliers`);
    return { success: true, data: newSupplier };
  } catch (error) {
    return handleActionError(error, 'creating supplier');
  }
}

/**
 * Updates an existing supplier.
 * @param input - The update payload including the supplier ID.
 * @returns ActionResponse containing the updated supplier or an error.
 */
export async function updateSupplier(input: UpdateSupplierPayload): Promise<ActionResponse<Supplier>> {
  try {
    const { organizationId } = await getServerAuthContext(); // Throws if unauthorized

    // Validate input payload
    const validation = UpdateSupplierPayloadSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Invalid input.',
        details: validation.error.format(),
      };
    }

    const { id: supplierId, customFields, ...updateData } = validation.data;
    const customFieldsString = JSON.stringify(customFields);

    // Ensure the supplier exists within the org before checking uniqueness/updating
    const supplierToUpdate = await db.supplier.findUnique({
      where: { id: supplierId, organizationId },
      select: { id: true }, // Only need to confirm existence
    });

    if (!supplierToUpdate) {
      return { success: false, error: 'Supplier not found or access denied.' };
    }

    // Manually check unique constraints *before* attempting update, *if* fields are changing
    if (updateData.name) {
      const existingName = await db.supplier.findFirst({
        where: {
          organizationId,
          name: updateData.name,
          NOT: { id: supplierId }, // Exclude the current supplier
        },
        select: { id: true },
      });
      if (existingName) {
        return {
          success: false,
          error: `Another supplier with the name "${updateData.name}" already exists.`,
        };
      }
    }
    if (updateData.email) {
      const existingEmail = await db.supplier.findFirst({
        where: {
          organizationId,
          email: updateData.email,
          NOT: { id: supplierId },
        },
        select: { id: true },
      });
      if (existingEmail) {
        return {
          success: false,
          error: `Another supplier with email "${updateData.email}" already exists.`,
        };
      }
    }

    // Perform the update
    const updatedSupplier = await db.supplier.update({
      where: {
        id: supplierId,
        organizationId,
      },
      data: { ...updateData, customFields: customFieldsString },
    });

    // Revalidate cache paths
    revalidatePath(`/dashboard/${organizationId}/suppliers`);
    revalidatePath(`/dashboard/${organizationId}/suppliers/${supplierId}`);
    return { success: true, data: updatedSupplier };
  } catch (error) {
    return handleActionError(error, 'updating supplier');
  }
}

/**
 * Deletes a supplier. Prevents deletion if linked to purchase orders.
 * @param input - The payload containing the supplier ID to delete.
 * @returns ActionResponse containing the ID of the deleted supplier or an error.
 */
export async function deleteSupplier(input: DeleteSupplierPayload): Promise<ActionResponse<{ id: string }>> {
  try {
    const { organizationId } = await getServerAuthContext(); // Throws if unauthorized

    // Validate input payload
    const validation = DeleteSupplierPayloadSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: 'Invalid input.',
        details: validation.error.format(),
      };
    }

    const { id } = validation.data;

    // Check if supplier is linked to Purchases, which should block deletion [cite: 67]
    // Assumes Purchase relation to Supplier uses onDelete: Restrict (or similar)
    const purchaseCount = await db.purchase.count({
      where: { supplierId: id, organizationId },
    });

    if (purchaseCount > 0) {
      // Soft delete: Mark as inactive instead of removing
      await db.supplier.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        success: false,
        error: `Cannot delete supplier: Linked to ${purchaseCount} purchase order(s). Please reassign or delete related purchases first.`,
      };
    }

    // Optional: Check other relations like ProductSupplier[cite: 46], Expenses[cite: 193], StockBatches [cite: 127]
    // based on schema relations and business rules.
    // The ProductSupplier relation uses onDelete: Cascade[cite: 46], so links will be removed automatically.

    // Perform deletion
    const deletedSupplier = await db.supplier.delete({
      where: {
        id: id,
        organizationId: organizationId, // Ensure delete happens within the correct org
      },
      select: { id: true }, // Only return the ID
    });

    // Revalidate cache paths
    revalidatePath(`/dashboard/${organizationId}/suppliers`);
    return { success: true, data: { id: deletedSupplier.id } };
  } catch (error) {
    // Error handling includes P2014/P2003 for foreign key constraints
    return handleActionError(error, 'deleting supplier');
  }
}

// --- Read Actions ---

/**
 * Retrieves a paginated, searchable, and filterable list of suppliers
 * for the current organization.
 *
 * @param {object} options - Optional parameters for querying suppliers.
 * @param {string} [options.searchQuery] - Text to search in supplier name or email.
 * @param {{ isActive?: boolean }} [options.filter] - Filtering options.
 * @param {number} [options.page=1] - The page number to retrieve (1-based).
 * @param {number} [options.pageSize=10] - The number of suppliers per page.
 * @returns {Promise<ActionResponse<{ suppliers: Supplier[], totalCount: number, totalPages: number, currentPage: number }>>} - The list of suppliers with pagination info or an error.
 */
export async function getSuppliers(options: {
  searchQuery?: string;
  filter?: { isActive?: boolean };
  page?: number;
  pageSize?: number;
}): Promise<
  ActionResponse<{
    suppliers: Supplier[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }>
> {
  try {
    const { organizationId } = await getServerAuthContext(); // Throws if unauthorized

    const { searchQuery, filter, page = 1, pageSize = 10 } = options;

    const currentPage = Math.max(1, page);
    const take = Math.max(1, pageSize);
    const skip = (currentPage - 1) * take;

    // Construct where clause based on search and filter
    const whereClause: Prisma.SupplierWhereInput = {
      organizationId,
      ...(searchQuery && {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } },
          { contactName: { contains: searchQuery, mode: 'insensitive' } },
        ],
      }),
      ...(filter?.isActive !== undefined && {
        isActive: filter.isActive,
      }),
    };

    // Fetch suppliers and total count in parallel
    const [suppliers, totalCount] = await Promise.all([
      db.supplier.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      db.supplier.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / take);

    return {
      success: true,
      data: {
        suppliers,
        totalCount,
        totalPages,
        currentPage,
      },
    };
  } catch (error) {
    return handleActionError(error, 'fetching suppliers');
  }
}

/**
 * Retrieves a single supplier by ID, ensuring it belongs to the current organization.
 * @param supplierId - The ID of the supplier to fetch.
 * @returns ActionResponse containing the supplier or null if not found/denied, or an error.
 */
export async function getSupplier(supplierId: string): Promise<ActionResponse<Supplier | null>> {
  // Basic ID validation before hitting DB/Auth
  if (!supplierId || typeof supplierId !== 'string' || supplierId.length < 5) {
    // Basic check
    return { success: false, error: 'Invalid Supplier ID format.' };
  }

  try {
    const { organizationId } = await getServerAuthContext(); // Throws if unauthorized

    const supplier = await db.supplier.findUnique({
      where: {
        id: supplierId,
        organizationId: organizationId, // Ensure fetch is within the authorized org
      },
    });

    // Return null in data if not found within the org, handled by error handler otherwise
    if (!supplier) {
      // Use generic not found/denied message
      return { success: false, error: 'Supplier not found or access denied.' };
    }

    return { success: true, data: supplier };
  } catch (error) {
    return handleActionError(error, 'fetching supplier details');
  }
}

// --- Toggle Supplier Status (Example of another action) ---
export async function toggleSupplierStatus(id: string, currentStatus: boolean) {
  if (!id) {
    return { success: false, message: 'Supplier ID is required.' };
  }
  const { organizationId } = await getServerAuthContext();
  try {
    const updatedSupplier = await db.supplier.update({
      where: { id, organizationId },
      data: { isActive: !currentStatus },
    });
    revalidatePath('/suppliers');
    return {
      success: true,
      message: `Supplier ${updatedSupplier.isActive ? 'activated' : 'deactivated'}.`,
      supplier: updatedSupplier,
    };
  } catch (error) {
    console.error(`Failed to toggle status for supplier ${id}:`, error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, message: 'Supplier not found.' };
    }
    return {
      success: false,
      message: 'Database error: Failed to update status.',
    };
  }
}


// Define the expected response structure based on the function's usage
// (These should ideally be defined in a shared types file)
interface SupplierStockHistoryItem {
  // Purchase Info
  purchaseId: string;
  purchaseItemId: string;
  purchaseNumber: string | null;
  purchaseDate: Date;

  // Product Info
  productId: string | null; // Nullable if variant/product somehow missing
  variantId: string | null; // Nullable if variant somehow missing
  productName: string;
  productSku: string | null; // Nullable if variant missing
  productCategory: string;

  // Item/Batch Specifics
  stockId: string | null; // Ambiguous: Remains null as PurchaseItem doesn't map directly to a single Stock ID
  batchNumber: string | null;
  expiryDate: Date | null;
  isExpired: boolean | null;
  daysUntilExpiry: number | null;

  // Quantities & Costs
  quantityPurchased: number; // orderedQuantity from PurchaseItem
  quantityReceived: number | null; // receivedQuantity from PurchaseItem
  quantityRemaining: number | null; // currentQuantity from the primary StockBatch
  buyingPricePerUnit: number; // unitCost from PurchaseItem
  totalBuyingPrice: number; // totalCost from PurchaseItem

  // Metadata
  unit: string | null; // No standard field in schema for general unit
  notes: string | null; // From parent Purchase
  attachmentUrl: string | null; // Requires separate Attachment query

  // Transaction Info
  transactionId: string; // Using Purchase ID
  transactionDate: Date;
  transactionType: 'PURCHASE';

  // Supplier Info
  supplierName: string;
  supplierId: string;
}

interface SupplierStockHistorySummary {
  totalProducts: number; // Unique products/variants on this page
  totalQuantityPurchased: number; // Total units ordered on this page
  totalValuePurchased: number; // Total value ordered on this page
  averagePricePerUnit: number; // Avg price on this page
  // Stock/Expiry related fields calculated *for this page only*
  upcomingExpiryCount: number; // Count items expiring soon on this page
  expiredCount: number; // Count expired items on this page
  zeroStockCount: number; // Count items with zero remaining stock in their batch on this page
  totalActiveStock: number; // Total quantity remaining in batches on this page (non-expired)
  highestValueProduct: { productId: string | null; productName: string; totalValue: number } | null;
  mostPurchasedProduct: { productId: string | null; productName: string; totalQuantity: number } | null;
  byCategory: { category: string; totalQuantity: number; totalValue: number; percentage: number }[];
}

interface SupplierInfo {
  id: string;
  name: string;
  contactPerson: string | null;
  totalSpent: number | null; // Requires aggregating all purchases, not just page
  lastOrderDate: Date | null; // Most recent order date on this page
}

interface SupplierStockHistoryResponse {
  items: SupplierStockHistoryItem[];
  // Pagination
  totalItems: number; // Total number of *Purchases* for the supplier
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  // Summary (Calculated based on current page's items)
  summary: SupplierStockHistorySummary;
  // Supplier Info
  supplierInfo: SupplierInfo;
}

// Helper functions for date calculations
function calculateDaysUntilExpiry(expiryDate: Date | null): number | null {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0); // Normalize expiry date
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function isDateExpired(expiryDate: Date | null): boolean | null {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0); // Normalize expiry date
  return expiry < today;
}

/**
 * Retrieves Purchase history for a specific supplier with pagination.
 * Maps Purchase/PurchaseItem data to the SupplierStockHistoryItem format,
 * including related batch information where available.
 * NOTE: This function throws errors directly rather than using ActionResponse,
 * assuming specific handling by the caller.
 *
 * @param supplierId - The ID of the supplier.
 * @param page - Current page number (1-based).
 * @param pageSize - Number of items per page.
 * @returns Purchase history adapted to SupplierStockHistoryResponse format.
 * @throws {Error} - If supplier not found, invalid input, or database error occurs.
 */
export async function getSupplierPurchaseHistory(
  supplierId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<SupplierStockHistoryResponse> {
  // Validate inputs
  if (!supplierId || typeof supplierId !== 'string' || supplierId.length < 5) {
    throw new Error('Invalid Supplier ID format.');
  }
  if (page < 1 || pageSize < 1 || !Number.isInteger(page) || !Number.isInteger(pageSize)) {
    throw new Error('Invalid pagination parameters: Page and PageSize must be positive integers.');
  }

  try {
    const { organizationId } = await getServerAuthContext(); // Throws if unauthorized

    // 1. Verify Supplier Existence within the organization
    const supplier = await db.supplier.findUnique({
      where: { id: supplierId, organizationId },
      select: { id: true, name: true, contactName: true }, // Select only needed fields [cite: 42]
    });
    if (!supplier) {
      throw new Error('Supplier not found or access denied.');
    }

    // 2. Prepare Pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // 3. Fetch Total Purchase Count and Paginated Purchases in Parallel
    // Note: totalItems counts Purchases, not PurchaseItems. The response items list PurchaseItems.
    const [totalPurchaseDocuments, purchases] = await Promise.all([
      db.purchase.count({
        where: { supplierId, organizationId },
      }),
      db.purchase.findMany({
        where: { supplierId, organizationId },
        skip,
        take,
        include: {
          items: {
            // Include PurchaseItems [cite: 70]
            include: {
              variant: {
                // Include Variant details [cite: 71, 38]
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  productId: true,
                  product: { select: { name: true, category: { select: { name: true } } } }, // [cite: 38, 28]
                },
              },
              // Include StockBatches linked to purchase item to get batch/expiry info [cite: 120]
              stockBatches: {
                select: {
                  id: true, // stockId placeholder could use this, but mapping is complex
                  batchNumber: true, // [cite: 119]
                  expiryDate: true, // [cite: 125]
                  currentQuantity: true,
                },
                orderBy: {
                  // Get the first batch reliably if needed
                  createdAt: 'asc',
                },
                take: 1, // Assume we primarily care about the first batch created for this item line
              },
            },
          },
          member: {
            // Include Member who created the purchase [cite: 67, 11]
            select: { id: true, user: { select: { name: true, email: true } } }, // Select necessary user fields [cite: 1, 2]
          },
        },
        orderBy: { orderDate: 'desc' }, // Order purchases by date
      }),
    ]);

    // Calculate total pages based on the number of *Purchases*
    const totalPages = Math.ceil(totalPurchaseDocuments / take);

    // 4. Transform Purchase data into SupplierStockHistoryItem format
    const historyItems: SupplierStockHistoryItem[] = purchases.flatMap(purchase =>
      purchase.items.map(item => {
        // Prefer variant details if available, fallback gracefully
        const productName = item.variant ? `${item.variant.product.name} (${item.variant.name})` : 'Unknown Product'; // Fallback if variant or product somehow missing
        const productSku = item.variant?.sku ?? null; // [cite: 38]
        const productCategory = item.variant?.product?.category?.name ?? 'Uncategorized'; // [cite: 28]
        const productId = item.variant?.productId ?? null; // [cite: 38]
        const variantId = item.variant?.id ?? null; // [cite: 71] - Corrected from item.variantId

        // Extract details from the first associated stock batch, if available
        const firstBatch = item.stockBatches?.[0]; // [cite: 120]
        const batchNumber = firstBatch?.batchNumber ?? null; // [cite: 119]
        const expiryDate = firstBatch?.expiryDate ?? null; // [cite: 125]
        const quantityRemaining = firstBatch?.currentQuantity ?? null; // [cite: 120]

        // Calculate expiry status
        const isExpired = isDateExpired(expiryDate);
        const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);

        return {
          // Purchase Info
          purchaseId: purchase.id, // [cite: 67]
          purchaseItemId: item.id, // [cite: 70]
          purchaseNumber: purchase.purchaseNumber, // [cite: 67]
          purchaseDate: purchase.orderDate, // [cite: 67]

          // Product Info
          productId: productId,
          variantId: variantId,
          productName: productName,
          productSku: productSku,
          productCategory: productCategory,

          // Item/Batch Specifics - Populated from first batch
          stockId: null, // Still ambiguous, keeping null. Could use firstBatch?.id if needed.
          batchNumber: batchNumber,
          expiryDate: expiryDate,
          isExpired: isExpired,
          daysUntilExpiry: daysUntilExpiry,

          // Quantities & Costs from PurchaseItem [cite: 70]
          quantityPurchased: item.orderedQuantity,
          quantityReceived: item.receivedQuantity, // This is from PurchaseItem, may differ from batch quantity
          quantityRemaining: quantityRemaining, // From StockBatch [cite: 120]
          buyingPricePerUnit: item.unitCost.toNumber(), // unitCost from PurchaseItem [cite: 70]
          totalBuyingPrice: item.totalCost.toNumber(), // totalCost from PurchaseItem [cite: 70]

          // Metadata
          unit: null, // Unit info not standard on PurchaseItem/Product/Variant in base schema [cite: 1]
          notes: purchase.notes, // From parent Purchase [cite: 69]
          attachmentUrl: null, // Requires Attachment model query, cannot derive from includes [cite: 151, 155]

          // Transaction Info (Context is Purchase)
          transactionId: purchase.id, // Use Purchase ID as reference [cite: 67]
          transactionDate: purchase.orderDate, // [cite: 67]
          transactionType: 'PURCHASE',

          // Supplier Info (already known contextually)
          supplierName: supplier.name, // [cite: 42]
          supplierId: supplier.id, // [cite: 42]
        };
      })
    );

    // 5. Calculate Summary Statistics (Based ONLY on the fetched page of PurchaseItems)
    const totalQuantityPurchasedPage = historyItems.reduce((sum, item) => sum + (item.quantityPurchased ?? 0), 0);
    const totalValuePurchasedPage = historyItems.reduce((sum, item) => sum + (item.totalBuyingPrice ?? 0), 0);

    // Calculate page-level stock/expiry stats from the transformed items
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    let upcomingExpiryCountPage = 0;
    let expiredCountPage = 0;
    let zeroStockCountPage = 0;
    let totalActiveStockPage = 0;

    historyItems.forEach(item => {
      if (item.isExpired === true) {
        expiredCountPage++;
      } else if (item.expiryDate && item.expiryDate <= thirtyDaysFromNow) {
        // Consider items expiring within 30 days as "upcoming"
        // Check > 0 to not double count already expired ones handled above.
        if (item.daysUntilExpiry !== null && item.daysUntilExpiry >= 0) {
          upcomingExpiryCountPage++;
        }
      }

      if (item.quantityRemaining === 0) {
        zeroStockCountPage++;
      }

      // Add to active stock only if not expired and quantity > 0
      if (item.isExpired === false && item.quantityRemaining !== null && item.quantityRemaining > 0) {
        totalActiveStockPage += item.quantityRemaining;
      } else if (item.isExpired === null && item.quantityRemaining !== null && item.quantityRemaining > 0) {
        // Include items with no expiry date but positive stock as active
        totalActiveStockPage += item.quantityRemaining;
      }
    });

    // Product aggregation (based on current page data)
    const productMapPage = new Map<
      string, // Using product ID or variant ID as key
      {
        productId: string | null;
        variantId?: string | null;
        productName: string;
        totalValue: number;
        totalQuantity: number;
      }
    >();
    historyItems.forEach(item => {
      // Use variantId if available, otherwise productId (handling potential nulls)
      const mapKey = item.variantId ?? item.productId ?? 'unknown';
      if (mapKey === 'unknown') return; // Skip if we can't identify the product/variant

      if (!productMapPage.has(mapKey)) {
        productMapPage.set(mapKey, {
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName, // Already formatted name
          totalValue: 0,
          totalQuantity: 0,
        });
      }
      const product = productMapPage.get(mapKey)!;
      product.totalValue += item.totalBuyingPrice ?? 0;
      product.totalQuantity += item.quantityPurchased ?? 0; // Based on purchased qty
    });
    const productsPage = Array.from(productMapPage.values());
    const highestValueProductPage =
      productsPage.length > 0 ? productsPage.reduce((max, p) => (p.totalValue > max.totalValue ? p : max)) : null;
    const mostPurchasedProductPage =
      productsPage.length > 0 ? productsPage.reduce((max, p) => (p.totalQuantity > max.totalQuantity ? p : max)) : null;

    // Category aggregation (based on current page data)
    const categoryMapPage = new Map<string, { category: string; totalQuantity: number; totalValue: number }>();
    historyItems.forEach(item => {
      const category = item.productCategory || 'Uncategorized';
      if (!categoryMapPage.has(category)) {
        categoryMapPage.set(category, { category, totalQuantity: 0, totalValue: 0 });
      }
      const cat = categoryMapPage.get(category)!;
      cat.totalQuantity += item.quantityPurchased ?? 0; // Based on purchased qty
      cat.totalValue += item.totalBuyingPrice ?? 0;
    });
    const byCategoryPage = Array.from(categoryMapPage.values()).map(cat => ({
      ...cat,
      percentage: totalValuePurchasedPage > 0 ? (cat.totalValue / totalValuePurchasedPage) * 100 : 0,
    }));

    // 6. Build and Return Response
    const response: SupplierStockHistoryResponse = {
      items: historyItems,
      // Pagination based on total Purchase documents
      totalItems: totalPurchaseDocuments,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      // Summary (Calculated based *only* on current page's items)
      summary: {
        totalProducts: productMapPage.size,
        totalQuantityPurchased: totalQuantityPurchasedPage,
        totalValuePurchased: totalValuePurchasedPage,
        averagePricePerUnit: totalQuantityPurchasedPage > 0 ? totalValuePurchasedPage / totalQuantityPurchasedPage : 0,
        // Stock/Expiry related fields calculated for this page
        upcomingExpiryCount: upcomingExpiryCountPage,
        expiredCount: expiredCountPage,
        zeroStockCount: zeroStockCountPage,
        totalActiveStock: totalActiveStockPage, // Sum of non-expired, >0 quantityRemaining on this page
        // Top products based on this page
        highestValueProduct: highestValueProductPage
          ? {
              productId: highestValueProductPage.productId,
              productName: highestValueProductPage.productName,
              totalValue: highestValueProductPage.totalValue,
            }
          : null,
        mostPurchasedProduct: mostPurchasedProductPage
          ? {
              productId: mostPurchasedProductPage.productId,
              productName: mostPurchasedProductPage.productName,
              totalQuantity: mostPurchasedProductPage.totalQuantity,
            }
          : null,
        byCategory: byCategoryPage,
      },
      // Supplier Info
      supplierInfo: {
        id: supplier.id, // [cite: 42]
        name: supplier.name, // [cite: 42]
        contactPerson: supplier.contactName ?? null, // [cite: 42]
        totalSpent: null, // Requires aggregating *all* purchases for the supplier, not just this page
        lastOrderDate: purchases.length > 0 ? purchases[0].orderDate : null, // Most recent order date on this page [cite: 67]
      },
    };

    return response;
  } catch (error) {
    console.error('Get Supplier Purchase History Error:', error);
    // Re-throw specific errors or a generic one
    if (error instanceof Error) {
      // Propagate specific messages like "Supplier not found..."
      if (error.message.includes('not found') || error.message.startsWith('Access Denied')) {
        throw new Error('Supplier not found or access denied.');
      }
      // Rethrow other specific errors caught within try block
      throw error;
    }
    // Fallback generic error
    throw new Error('Failed to fetch supplier purchase history due to an unexpected error.');
  }
}