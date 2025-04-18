// actions/supplier.actions.ts
'use server';

import { db } from '@/lib/db'; // Adjust path if needed
import { Supplier, Prisma, MemberRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { ActionResponse, SupplierStockHistoryItem, SupplierStockHistoryResponse } from '@/lib/types/suppliers'; // Assuming these types exist
import { getServerAuthContext } from './auth';
import { CreateSupplierPayload, CreateSupplierPayloadSchema, DeleteSupplierPayload, DeleteSupplierPayloadSchema, UpdateSupplierPayload, UpdateSupplierPayloadSchema } from '@/lib/validations/suppliers';

// --- Authorization Helper ---

/**
 * Checks if the authenticated user has the required role(s) within the organization.
 * Throws an error if authorization fails.
 */
async function checkAuthorization(
    userId: string,
    organizationId: string,
    requiredRoles: MemberRole | MemberRole[]
) {
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    if (rolesArray.length === 0) {
        // If no specific role required, just being part of the org is enough
        const member = await db.member.findUnique({
             where: { organizationId_userId: { organizationId, userId } },
             select: { id: true } // Select minimal field
        });
         if (!member) {
            throw new Error("Access Denied: You are not a member of this organization.");
        }
        return; // Authorized (is a member)
    }

    const member = await db.member.findUnique({
        where: {
            organizationId_userId: { organizationId, userId },
        },
        select: { role: true },
    });

    if (!member) {
        throw new Error("Access Denied: You are not a member of this organization.");
    }

    if (!rolesArray.includes(member.role)) {
        console.warn(`Authorization Failed: User ${userId} attempted action requiring roles ${rolesArray.join(', ')} in org ${organizationId} but has role ${member.role}`);
        throw new Error(`Access Denied: You require one of the following roles: ${rolesArray.join(', ')}`);
    }
    // If we reach here, the user is authorized
}





// --- Actions ---

export async function createSupplier(
  input: CreateSupplierPayload
): ActionResponse<Supplier> {
  try {
    const { userId, organizationId } = await getServerAuthContext();
    // Authorization Check: Only Admins or Managers can create suppliers? Adjust roles as needed.
    await checkAuthorization(userId, organizationId, [
      MemberRole.OWNER,
      MemberRole.MANAGER,
    ]);

    const validation = CreateSupplierPayloadSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid input.",
        details: validation.error.format(),
      };
    }

    const { name, email, ...restData } = validation.data;

    // Check uniqueness (name within org) using the correct compound index field name from your schema
    const existingName = await db.supplier.findUnique({
      where: { organizationId, name },
    });
    if (existingName) {
      return {
        success: false,
        error: `Supplier with name "${name}" already exists in this organization.`,
      };
    }

    // Check email uniqueness *within the organization* if provided
    if (email) {
      const existingEmail = await db.supplier.findFirst({
        where: { organizationId, email },
      });
      if (existingEmail) {
        return {
          success: false,
          error: `Supplier with email ${email} already exists in this organization.`,
        };
      }
    }

    const newSupplier = await db.supplier.create({
      data: {
        ...restData,
        name, // Add name back
        email, // Add email back
        organizationId: organizationId, // Add organizationId from context
      },
    });

    revalidatePath(`/dashboard/${organizationId}/suppliers`); // Use orgId from context
    return { success: true, data: newSupplier };
  } catch (error) {
    console.error("Create Supplier Error:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // More specific error based on potential unique fields (name, email)
      const target = (error.meta?.target as string[]) ?? [];
      if (target.includes("name"))
        return {
          success: false,
          error: "A supplier with this name already exists.",
        };
      if (target.includes("email"))
        return {
          success: false,
          error: "A supplier with this email already exists.",
        };
      return {
        success: false,
        error: "A supplier with this unique identifier already exists.",
      };
    }
    if (error instanceof Error && error.message.startsWith("Access Denied")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create supplier." };
  }
}

export async function updateSupplier(
  input: UpdateSupplierPayload
): ActionResponse<Supplier> {
  try {
    const { userId, organizationId } = await getServerAuthContext();
    // Auth Check: Admins or Managers can update?
    await checkAuthorization(userId, organizationId, [
      MemberRole.OWNER,
      MemberRole.MANAGER,
    ]);

    const validation = UpdateSupplierPayloadSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid input.",
        details: validation.error.format(),
      };
    }

    const { id: supplierId, ...updateData } = validation.data;

    // Check uniqueness constraints ONLY if the fields are being changed
    if (updateData.name) {
      const existing = await db.supplier.findUnique({
        where: {
          organizationId,
          name: updateData.name,
          // Exclude the current supplier from the check
          NOT: { id: supplierId },
        },
      });
      if (existing) {
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
          NOT: { id: supplierId }, // Exclude self
        },
      });
      if (existingEmail) {
        return {
          success: false,
          error: `Another supplier with the email ${updateData.email} already exists.`,
        };
      }
    }

    const updatedSupplier = await db.supplier.update({
      where: {
        id: supplierId,
        organizationId: organizationId, // Ensure update is within the authorized org
      },
      data: updateData, // Prisma automatically handles partial updates
    });

    revalidatePath(`/dashboard/${organizationId}/suppliers`);
    revalidatePath(`/dashboard/${organizationId}/suppliers/${supplierId}`);
    return { success: true, data: updatedSupplier };
  } catch (error) {
    console.error("Update Supplier Error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        // Record to update not found
        return {
          success: false,
          error: "Supplier not found or access denied.",
        };
      }
      if (error.code === "P2002") {
        // Unique constraint violation
        const target = (error.meta?.target as string[]) ?? [];
        if (target.includes("name"))
          return {
            success: false,
            error: "A supplier with this name already exists.",
          };
        if (target.includes("email"))
          return {
            success: false,
            error: "A supplier with this email already exists.",
          };
        return {
          success: false,
          error: "A supplier with this unique identifier already exists.",
        };
      }
    }
    if (error instanceof Error && error.message.startsWith("Access Denied")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update supplier." };
  }
}

export async function deleteSupplier(
  input: DeleteSupplierPayload
): ActionResponse<{ id: string }> {
  try {
    const { userId, organizationId } = await getServerAuthContext();
    // Auth Check: Only Admins/Owners can delete?
    await checkAuthorization(userId, organizationId, [MemberRole.OWNER]);

    const validation = DeleteSupplierPayloadSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid input.",
        details: validation.error.format(),
      };
    }

    const { id } = validation.data;

    // Check if supplier is linked to Purchases (more relevant based on your schema)
    const purchaseCount = await db.purchase.count({
      where: { supplierId: id, organizationId }, // Check within the org
    });

    if (purchaseCount > 0) {
      // Option 1: Prevent deletion
      return {
        success: false,
        error: `Cannot delete supplier: Linked to ${purchaseCount} purchase orders. Please reassign or delete related purchases first.`,
      };
      // Option 2: Allow deletion (if relation onDelete is SET NULL or CASCADE, but be careful)
      // If onDelete is Restrict (default), Prisma will throw P2014 error below if linked.
    }

    // Also check ProductSupplier links if necessary (though maybe less critical for deletion blocking)
    const productLinkCount = await db.productSupplier.count({
      where: { supplierId: id },
    });
    if (productLinkCount > 0) {
      // Decide if this should block deletion or just be a warning
      console.warn(
        `Supplier ${id} is linked to ${productLinkCount} products via ProductSupplier.`
      );
      // Depending on your rules, you might want to delete ProductSupplier links first or block here too.
      // For now, let's allow deletion even if linked to products, but block if linked to Purchases.
    }

    // Delete ProductSupplier links first if needed (adjust based on your cascade/relation settings)
    // await db.productSupplier.deleteMany({ where: { supplierId: id }});

    const deletedSupplier = await db.supplier.delete({
      where: {
        id: id,
        organizationId: organizationId, // Ensure delete is within the authorized org
      },
    });

    revalidatePath(`/dashboard/${organizationId}/suppliers`);
    return { success: true, data: { id: deletedSupplier.id } };
  } catch (error) {
    console.error("Delete Supplier Error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        // Record to delete not found
        return {
          success: false,
          error: "Supplier not found or access denied.",
        };
      }
      if (error.code === "P2014" || error.code === "P2003") {
        // Foreign key constraint failed (likely due to linked Purchases if onDelete=Restrict)
        return {
          success: false,
          error:
            "Cannot delete supplier: It is still linked to other records (e.g., Purchase Orders).",
        };
      }
    }
    if (error instanceof Error && error.message.startsWith("Access Denied")) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete supplier." };
  }
}


// --- Read Actions ---

export async function getSuppliers(): ActionResponse<Supplier[]> {
    try {
        const { organizationId } = await getServerAuthContext();
        // await checkAuthorization(userId, organizationId, []); // Empty array checks if user is member

        const suppliers = await db.supplier.findMany({
            where: { organizationId }, // Filter by context orgId
            orderBy: { name: 'asc' }
        });
        return { success: true, data: suppliers };
    } catch (error) {
        console.error("Get Suppliers Error:", error);
         if (error instanceof Error && error.message.startsWith("Access Denied")) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Failed to fetch suppliers." };
    }
}

export async function getSupplier(supplierId: string): ActionResponse<Supplier | null> {
    // Basic ID validation before hitting DB/Auth
     if (!supplierId || typeof supplierId !== 'string' || supplierId.length < 5) { // Basic check for CUID like structure
         return { success: false, error: 'Invalid Supplier ID format.' };
     }

    try {
        const { userId, organizationId } = await getServerAuthContext();
        // Auth Check: Any member can view a specific supplier?
        await checkAuthorization(userId, organizationId, []);

        const supplier = await db.supplier.findUnique({
            where: {
                id: supplierId,
                organizationId: organizationId // Ensure fetch is within the authorized org
             },
        });

        if (!supplier) {
            // Don't leak existence, just say not found/denied
            return { success: false, error: 'Supplier not found or access denied.' };
        }
        return { success: true, data: supplier };
    } catch (error) {
        console.error("Get Supplier Error:", error);
         if (error instanceof Error && error.message.startsWith("Access Denied")) {
            return { success: false, error: error.message };
        }
        return { success: false, error: "Failed to fetch supplier details." };
    }
}


/**
 * Retrieves Purchase history for a specific supplier with filtering and pagination.
 * REWRITTEN BASED ON PROVIDED SCHEMA (Purchase, PurchaseItem, Product models)
 *
 * @param supplierId - The ID of the supplier
 * @param page - Current page number (1-based)
 * @param pageSize - Number of items per page
 * @returns Purchase history with pagination and summary statistics
 */
export async function getSupplierPurchaseHistory(
    supplierId: string,
    page: number = 1,
    pageSize: number = 20
): Promise<SupplierStockHistoryResponse> { // Re-using type, adjust if needed
     // Basic ID validation
     if (!supplierId || typeof supplierId !== 'string' || supplierId.length < 5) {
         throw new Error('Invalid Supplier ID format.');
     }
      if (page < 1 || pageSize < 1) {
         throw new Error('Invalid pagination parameters.');
     }

    try {
        const { userId, organizationId } = await getServerAuthContext();
        // Auth Check: Allow members to view history?
        await checkAuthorization(userId, organizationId, []);

        // 1. Get Supplier Info (and verify existence within org)
        const supplier = await db.supplier.findUnique({
            where: { id: supplierId, organizationId },
        });
        if (!supplier) {
            throw new Error("Supplier not found or access denied");
        }

        // 2. Calculate Pagination for Purchases
        const skip = (page - 1) * pageSize;
        const totalItems = await db.purchase.count({
            where: { supplierId, organizationId }, // Count purchases for this supplier in this org
        });
        const totalPages = Math.ceil(totalItems / pageSize);

        // 3. Get Paginated Purchase Records with related items and product details
        const purchases = await db.purchase.findMany({
            where: { supplierId, organizationId },
            skip,
            take: pageSize,
            include: {
                items: { // Include PurchaseItems
                    include: {
                        product: { // Include Product details for each item
                            select: { id: true, name: true, sku: true, category: { select: { name: true } } }
                        },
                        variant: { // Include Variant details if applicable
                            select: { id: true, name: true, sku: true }
                        },
                        // Include StockBatches created from this PurchaseItem if needed for history
                        // stockBatches: { select: { id: true, batchNumber: true, expiryDate: true } }
                    }
                },
                 // Include the user (Member) who created the purchase if needed
                 member: { select: { id: true, user: { select: { name: true, email: true }} } }
            },
            orderBy: { orderDate: 'desc' }, // Order by most recent purchase
        });

        // 4. Transform Purchase data into SupplierStockHistoryItem format
        // NOTE: This format might need adjustment as it was based on a 'Stock' model.
        // We adapt it to represent individual PurchaseItems within Purchases.
        const historyItems: SupplierStockHistoryItem[] = purchases.flatMap(purchase =>
             purchase.items.map(item => {
                // Determine product/variant details
                 const productName = item.variant?.name ? `${item.product.name} - ${item.variant.name}` : item.product.name;
                 const productSku = item.variant?.sku ?? item.product.sku;

                 return {
                    purchaseId: purchase.id, // Link back to purchase
                    purchaseItemId: item.id, // Specific item ID
                    purchaseNumber: purchase.purchaseNumber, // From parent purchase
                    stockId: null, // No direct 'Stock' ID in this context, maybe batch ID if included?
                    productId: item.productId,
                    variantId: item.variantId, // Add variant ID
                    productName: productName,
                    productSku: productSku,
                    productCategory: item.product.category?.name ?? 'Uncategorized',
                    batchNumber: null, // Need to include stockBatches above if needed
                    purchaseDate: purchase.orderDate, // Use purchase order date
                    expiryDate: null, // Need to include stockBatches above if needed
                    quantityPurchased: item.orderedQuantity, // Quantity ordered in this item
                    quantityReceived: item.receivedQuantity, // Quantity received for this item
                    quantityRemaining: null, // This field doesn't directly map from PurchaseItem, depends on stock logic
                    buyingPricePerUnit: item.unitCost.toNumber(), // Cost for this item
                    totalBuyingPrice: item.totalCost.toNumber(), // Total cost for this item line
                    unit: null, // Unit not present in PurchaseItem, maybe add to Product?
                    attachmentUrl: null, // Requires attachments on Purchase/PurchaseItem model
                    notes: purchase.notes, // Notes from the parent purchase
                    transactionId: null, // This isn't a 'StockTransaction' context
                    transactionDate: purchase.orderDate, // Or receivedDate if preferred
                    transactionType: "PURCHASE", // Fixed type
                    supplierName: supplier.name,
                    supplierId: supplier.id,
                    isExpired: null, // Depends on batch expiry
                    daysUntilExpiry: null, // Depends on batch expiry
                 };
            })
        );

        // 5. Calculate Summary Statistics (based on the transformed historyItems)
        // Recalculate based on PurchaseItem data structure
        const totalQuantityPurchased = historyItems.reduce((sum, item) => sum + item.quantityPurchased, 0);
        const totalValuePurchased = historyItems.reduce((sum, item) => sum + item.totalBuyingPrice, 0);
        const averagePricePerUnit = totalQuantityPurchased > 0 ? totalValuePurchased / totalQuantityPurchased : 0; // This might be less meaningful if units vary

        // These depend on StockBatch data which isn't included by default - adapt if needed
        const upcomingExpiryCount = 0; // Placeholder - requires batch data
        const expiredCount = 0; // Placeholder - requires batch data
        const zeroStockCount = 0; // Placeholder - requires stock level data
        const totalActiveStock = 0; // Placeholder - requires stock level data


        // Find highest value and most purchased products (based on PurchaseItems)
        const productMap = new Map<string, { productId: string; variantId?: string | null; productName: string; totalValue: number; totalQuantity: number; }>();
        historyItems.forEach(item => {
            const mapKey = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
            if (!productMap.has(mapKey)) {
                productMap.set(mapKey, {
                    productId: item.productId,
                    variantId: item.variantId,
                    productName: item.productName, // Already includes variant name if applicable
                    totalValue: 0,
                    totalQuantity: 0,
                });
            }
            const product = productMap.get(mapKey)!;
            product.totalValue += item.totalBuyingPrice;
            product.totalQuantity += item.quantityPurchased;
        });

        const products = Array.from(productMap.values());
        const highestValueProduct = products.length > 0 ? products.reduce((max, p) => p.totalValue > max.totalValue ? p : max) : null;
        const mostPurchasedProduct = products.length > 0 ? products.reduce((max, p) => p.totalQuantity > max.totalQuantity ? p : max) : null;

        // Calculate by category
        const categoryMap = new Map<string, { category: string; totalQuantity: number; totalValue: number; }>();
        historyItems.forEach(item => {
            const category = item.productCategory!;
            if (!categoryMap.has(category)) {
                categoryMap.set(category, { category, totalQuantity: 0, totalValue: 0 });
            }
            const cat = categoryMap.get(category)!;
            cat.totalQuantity += item.quantityPurchased;
            cat.totalValue += item.totalBuyingPrice;
        });
        const byCategory = Array.from(categoryMap.values()).map(cat => ({
            ...cat,
            percentage: totalValuePurchased > 0 ? (cat.totalValue / totalValuePurchased) * 100 : 0,
        }));

        // 6. Build the Response
        const response: SupplierStockHistoryResponse = {
            items: historyItems, // These are now PurchaseItems
            totalItems: totalItems, // Total Purchases (not items) - adjust if needed
            totalPages,
            currentPage: page,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            summary: {
                totalProducts: productMap.size, // Number of unique product/variants purchased
                totalQuantityPurchased,
                totalValuePurchased,
                averagePricePerUnit,
                upcomingExpiryCount, // Needs batch data
                expiredCount, // Needs batch data
                zeroStockCount, // Needs stock level data
                totalActiveStock, // Needs stock level data
                highestValueProduct: highestValueProduct ? {
                    productId: highestValueProduct.productId,
                    productName: highestValueProduct.productName,
                    totalValue: highestValueProduct.totalValue,
                } : null,
                mostPurchasedProduct: mostPurchasedProduct ? {
                     productId: mostPurchasedProduct.productId,
                    productName: mostPurchasedProduct.productName,
                    totalQuantity: mostPurchasedProduct.totalQuantity,
                } : null,
                byCategory,
            },
            supplierInfo: {
                id: supplier.id,
                name: supplier.name,
                contactPerson: supplier.contactName ?? null, // Use correct field name
                totalSpent: totalValuePurchased, // Sum of purchase item costs
                lastOrderDate: purchases.length > 0 ? purchases[0].orderDate : null, // Date of the most recent purchase in this batch
            },
        };

        return response;

    } catch (error) {
        console.error("Get Supplier Purchase History Error:", error);
        // Don't expose detailed errors unless intended
        if (error instanceof Error && error.message.startsWith("Access Denied")) {
            throw error; // Re-throw auth errors to be handled upstream
        }
         if (error instanceof Error && error.message.includes("not found")) {
            throw new Error("Supplier not found or access denied."); // More generic error
        }
        throw new Error("Failed to fetch supplier purchase history."); // Generic error
    }
}


// --- Toggle Supplier Status (Example of another action) ---
export async function toggleSupplierStatus(id: string, currentStatus: boolean) {
  if (!id) {
    return { success: false, message: "Supplier ID is required." };
  }
  const { organizationId } = await getServerAuthContext();
  try {
    const updatedSupplier = await db.supplier.update({
      where: { id, organizationId },
      data: { isActive: !currentStatus },
    });
    revalidatePath("/suppliers");
    return {
      success: true,
      message: `Supplier ${updatedSupplier.isActive ? "activated" : "deactivated"}.`,
      supplier: updatedSupplier,
    };
  } catch (error) {
    console.error(`Failed to toggle status for supplier ${id}:`, error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { success: false, message: "Supplier not found." };
    }
    return {
      success: false,
      message: "Database error: Failed to update status.",
    };
  }
}


// interface SupplierStockHistoryByProductResponse {
//     items: {
//         productId: string;
//         productName: string; // Includes variant if applicable
//         productSku: string | null;
//         totalQuantityPurchased: number; // Based on orderedQuantity
//         totalValuePurchased: number; // Based on totalCost
//         averagePricePerUnit: number; // Based on unitCost
//         purchaseItems: SupplierStockHistoryItem[]; // Renamed from 'batches'
//     }[];
// }

// // Utility function remains the same conceptually, but operates on the transformed historyItems
// function groupSupplierHistoryByProduct(
//     historyItems: SupplierStockHistoryItem[] // These items now represent PurchaseItems
// ): SupplierStockHistoryByProductResponse["items"] {
//     const groupedByProduct : Record<string, SupplierStockHistoryByProductResponse["items"][number]> = {};

//     historyItems.forEach(item => {
//          // Group by product ID only, or include variant ID if you need variant-level grouping
//          const groupKey = item.productId; // Or `${item.productId}-${item.variantId}`
//         if (!groupedByProduct[groupKey]) {
//             groupedByProduct[groupKey] = {
//                 productId: item.productId,
//                 productName: item.productName, // Use the potentially variant-inclusive name
//                 productSku: item.productSku, // Use the potentially variant SKU
//                 totalQuantityPurchased: 0,
//                 totalValuePurchased: 0,
//                 // quantityRemaining: 0, // Cannot sum this reliably
//                 purchaseItems: [] // Store the individual purchase items
//             };
//         }

//         const group = groupedByProduct[groupKey];
//         group.totalQuantityPurchased += item.quantityPurchased; // Sum ordered quantities
//         group.totalValuePurchased += item.totalBuyingPrice; // Sum total costs
//         // group.quantityRemaining += item.quantityRemaining; // Cannot sum this
//         group.purchaseItems.push(item);
//     });

//     // Calculate average price for each product group
//     Object.values(groupedByProduct).forEach((group) => {
//         group.averagePricePerUnit = group.totalQuantityPurchased > 0
//             ? group.totalValuePurchased / group.totalQuantityPurchased
//             : 0;
//     });

//     return groupedByProduct;
// }

