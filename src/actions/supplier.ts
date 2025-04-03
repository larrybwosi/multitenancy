// actions/supplier.actions.ts
'use server';

import { z } from 'zod';
import { db } from '@/lib/db';
import { Supplier, Prisma, MemberRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getBusinessAuthContext } from './business'; // Assuming helper is in business actions
import { ActionResponse, SupplierStockHistoryItem, SupplierStockHistoryResponse } from '@/lib/types/suppliers';

// --- Zod Schemas ---

const OrganisationIdSchema = z.string().cuid({ message: 'Invalid Organisation ID' });
const RequiredCuidSchema = z.string().cuid({ message: 'Required ID is missing or invalid' });

const CreateSupplierSchema = z.object({
  organisationId: OrganisationIdSchema,
  name: z.string().min(2, { message: 'Supplier name is required' }),
  contactPerson: z.string().max(100).optional().nullable(),
  email: z.string().email({ message: 'Invalid email format' }).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

const UpdateSupplierSchema = z.object({
  id: RequiredCuidSchema,
  organisationId: OrganisationIdSchema, // For auth check
  name: z.string().min(2).optional(),
  contactPerson: z.string().max(100).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

const DeleteSupplierSchema = z.object({
  id: RequiredCuidSchema,
  organisationId: OrganisationIdSchema,
});



// --- Actions ---

export async function createSupplier(input: z.infer<typeof CreateSupplierSchema>): ActionResponse<Supplier> {
    try {
        const { organisationId } = input;
        // !! IMPORTANT: Auth Check !!
        await getBusinessAuthContext(organisationId, [MemberRole.ADMIN, MemberRole.STAFF]);

        const validation = CreateSupplierSchema.safeParse(input);
        if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

        // Check uniqueness (name within org)
        const existing = await db.supplier.findUnique({ where: { organisationId_name: { organisationId, name: validation.data.name } } });
        if (existing) return { success: false, error: `Supplier with name "${validation.data.name}" already exists.` };

        // Check email uniqueness if provided and required by schema/business rules
        if(validation.data.email) {
             const existingEmail = await db.supplier.findFirst({ where: { organisationId, email: validation.data.email }});
            if (existingEmail) return { success: false, error: `Supplier with email ${validation.data.email} already exists.` };
        }

        const newSupplier = await db.supplier.create({ data: validation.data });
        revalidatePath(`/dashboard/${organisationId}/suppliers`);
        return { success: true, data: newSupplier };
    } catch (error) {
        console.error("Create Supplier Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return { success: false, error: 'A supplier with this name or email already exists.' };
        }
        return { success: false, error: 'Failed to create supplier.' };
    }
}

export async function updateSupplier(input: z.infer<typeof UpdateSupplierSchema>): ActionResponse<Supplier> {
    try {
        const { organisationId, id } = input;
        console.log(id)
         // !! IMPORTANT: Auth Check !!
        await getBusinessAuthContext(organisationId, [MemberRole.ADMIN, MemberRole.STAFF]);

        const validation = UpdateSupplierSchema.safeParse(input);
        if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

        
        const { id: supplierId, organisationId: _, ...updateData } = validation.data;
        console.log(_)

        // Check uniqueness constraints if fields are being updated
        if (updateData.name) {
            const existing = await db.supplier.findFirst({ where: { organisationId, name: updateData.name, NOT: { id: supplierId } } });
            if (existing) return { success: false, error: `Supplier with name "${updateData.name}" already exists.` };
        }
        if(updateData.email) {
             const existingEmail = await db.supplier.findFirst({ where: { organisationId, email: updateData.email, NOT: { id: supplierId } }});
             if (existingEmail) return { success: false, error: `Supplier with email ${updateData.email} already exists.` };
        }

        const updatedSupplier = await db.supplier.update({
            where: { id: supplierId, organisationId },
            data: updateData,
        });

        revalidatePath(`/dashboard/${organisationId}/suppliers`);
        revalidatePath(`/dashboard/${organisationId}/suppliers/${supplierId}`);
        return { success: true, data: updatedSupplier };
    } catch (error) {
         console.error("Update Supplier Error:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return { success: false, error: 'Supplier not found.' };
        }
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return { success: false, error: 'A supplier with this name or email already exists.' };
        }
        return { success: false, error: 'Failed to update supplier.' };
    }
}

export async function deleteSupplier(input: z.infer<typeof DeleteSupplierSchema>): ActionResponse<{ id: string }> {
  try {
    const { organisationId, id } = input;
    // !! IMPORTANT: Auth Check !!
    await getBusinessAuthContext(organisationId, MemberRole.ADMIN); // Only admin deletes suppliers?

    const validation = DeleteSupplierSchema.safeParse(input);
    if (!validation.success) return { success: false, error: 'Invalid input.', details: validation.error.format() };

    // Check if supplier is linked to Stock entries
    const stockCount = await db.stock.count({ where: { supplierId: id, organisationId }});
    if (stockCount > 0) {
        // Option 1: Prevent deletion
        return { success: false, error: `Cannot delete supplier: Linked to ${stockCount} stock entries. Unlink stock first.` };
          // Option 2: Allow deletion (Prisma relation `onDelete: SetNull` handles unlinking)
    }

    await db.supplier.delete({ where: { id, organisationId } });

    revalidatePath(`/dashboard/${organisationId}/suppliers`);
    return { success: true, data: { id } };
  } catch (error) {
      console.error("Delete Supplier Error:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') { // Record not found
          return { success: false, error: 'Supplier not found.' };
      }
      return { success: false, error: 'Failed to delete supplier.' };
  }
}


// --- Read Actions ---

export async function getSuppliers(organisationId: string): ActionResponse<Supplier[]> {
  try {
    await getBusinessAuthContext(organisationId);
    const suppliers = await db.supplier.findMany({
        where: { organisationId },
        orderBy: { name: 'asc' }
    });
    return { success: true, data: suppliers };
  } catch (error: any) {
      console.error("Get Suppliers Error:", error);
      return { success: false, error: error.message || "Failed to fetch suppliers." };
  }
}



export async function getSupplier(organisationId: string, supplierId: string): ActionResponse<Supplier | null> {
  try {
    await getBusinessAuthContext(organisationId);
    const supplier = await db.supplier.findUnique({
        where: { id: supplierId, organisationId },
    });
      if (!supplier) {
        return { success: false, error: 'Supplier not found.' };
    }
    return { success: true, data: supplier };
  } catch (error: any) {
      console.error("Get Supplier Error:", error);
      return { success: false, error: error.message || "Failed to fetch supplier details." };
  }
}


/**
 * Retrieves detailed stock history for a specific supplier with filtering and pagination
 * 
 * @param organisationId - The ID of the organisation
 * @param supplierId - The ID of the supplier
 * @param filters - Optional filters and pagination parameters
 * @returns Detailed stock history with aggregated statistics
 */
export async function getSupplierHistory(
  organisationId: string,
  supplierId: string,
  page: number = 1,
  pageSize: number = 20
) {
  // Get supplier info
  const supplier = await db.supplier.findUnique({
    where: { id: supplierId, organisationId },
  });

  if (!supplier) {
    throw new Error("Supplier not found");
  }

  // Calculate pagination
  const skip = (page - 1) * pageSize;
  const totalItems = await db.stock.count({
    where: { supplierId, organisationId },
  });
  const totalPages = Math.ceil(totalItems / pageSize);

  // Get stock items with related product info
  const stockItems = await db.stock.findMany({
    where: { supplierId, organisationId },
    skip,
    take: pageSize,
    include: {
      product: {
        select: {
          name: true,
          sku: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      },
      stockTransactions: {
        where: {
          type: "PURCHASE",
        },
        take: 1,
        orderBy: {
          transactionDate: "desc",
        },
      },
    },
    orderBy: {
      purchaseDate: "desc",
    },
  });

  // Transform to SupplierStockHistoryItem format
  const items: SupplierStockHistoryItem[] = stockItems.map((stock) => {
    const transaction = stock.stockTransactions[0];
    const expiryDate = stock.expiryDate;
    const now = new Date();

    return {
      stockId: stock.id,
      productId: stock.productId,
      productName: stock.product.name,
      productSku: stock.product.sku,
      productCategory: stock.product.category?.name || null,
      batchNumber: stock.batchNumber,
      purchaseDate: stock.purchaseDate,
      expiryDate,
      quantityPurchased: Number(stock.quantityAvailable), // This assumes initial quantity equals purchased
      quantityRemaining: Number(stock.quantityAvailable),
      buyingPricePerUnit: Number(stock.buyingPricePerUnit),
      totalBuyingPrice:
        Number(stock.quantityAvailable) * Number(stock.buyingPricePerUnit),
      unit: stock.unit,
      attachmentUrl: null, // You would need to add attachments to your Stock model if needed
      notes: stock.notes,
      transactionId: transaction?.id || null,
      transactionDate: transaction?.transactionDate || null,
      transactionType: "PURCHASE",
      supplierName: supplier.name,
      supplierId: supplier.id,
      isExpired: expiryDate ? expiryDate < now : false,
      daysUntilExpiry: expiryDate
        ? Math.floor(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null,
    };
  });

  // Calculate summary
  const totalQuantityPurchased = items.reduce(
    (sum, item) => sum + item.quantityPurchased,
    0
  );
  const totalValuePurchased = items.reduce(
    (sum, item) => sum + item.totalBuyingPrice,
    0
  );
  const averagePricePerUnit =
    totalQuantityPurchased > 0
      ? totalValuePurchased / totalQuantityPurchased
      : 0;

  const upcomingExpiryCount = items.filter(
    (item) =>
      item.daysUntilExpiry !== null &&
      item.daysUntilExpiry > 0 &&
      item.daysUntilExpiry <= 30
  ).length;

  const expiredCount = items.filter((item) => item.isExpired).length;
  const zeroStockCount = items.filter(
    (item) => item.quantityRemaining <= 0
  ).length;
  const totalActiveStock = items.filter(
    (item) => item.quantityRemaining > 0
  ).length;

  // Find highest value and most purchased products
  const productMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      totalValue: number;
      totalQuantity: number;
    }
  >();

  items.forEach((item) => {
    if (!productMap.has(item.productId)) {
      productMap.set(item.productId, {
        productId: item.productId,
        productName: item.productName,
        totalValue: 0,
        totalQuantity: 0,
      });
    }
    const product = productMap.get(item.productId)!;
    product.totalValue += item.totalBuyingPrice;
    product.totalQuantity += item.quantityPurchased;
  });

  const products = Array.from(productMap.values());
  const highestValueProduct = products.reduce(
    (max, product) => (product.totalValue > max.totalValue ? product : max),
    { productId: "", productName: "", totalValue: 0, totalQuantity: 0 }
  );

  const mostPurchasedProduct = products.reduce(
    (max, product) =>
      product.totalQuantity > max.totalQuantity ? product : max,
    { productId: "", productName: "", totalValue: 0, totalQuantity: 0 }
  );

  // Calculate by category if needed
  const categoryMap = new Map<
    string,
    {
      category: string;
      totalQuantity: number;
      totalValue: number;
    }
  >();

  items.forEach((item) => {
    const category = item.productCategory || "Uncategorized";
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        totalQuantity: 0,
        totalValue: 0,
      });
    }
    const cat = categoryMap.get(category)!;
    cat.totalQuantity += item.quantityPurchased;
    cat.totalValue += item.totalBuyingPrice;
  });

  const byCategory = Array.from(categoryMap.values()).map((cat) => ({
    ...cat,
    percentage:
      totalValuePurchased > 0
        ? (cat.totalValue / totalValuePurchased) * 100
        : 0,
  }));

  // Build the response
  const response: SupplierStockHistoryResponse = {
    items,
    totalItems,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    summary: {
      totalProducts: productMap.size,
      totalQuantityPurchased,
      totalValuePurchased,
      averagePricePerUnit,
      upcomingExpiryCount,
      expiredCount,
      zeroStockCount,
      totalActiveStock,
      highestValueProduct: {
        productId: highestValueProduct.productId,
        productName: highestValueProduct.productName,
        totalValue: highestValueProduct.totalValue,
      },
      mostPurchasedProduct: {
        productId: mostPurchasedProduct.productId,
        productName: mostPurchasedProduct.productName,
        totalQuantity: mostPurchasedProduct.totalQuantity,
      },
      byCategory,
    },
    supplierInfo: {
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contactPerson || null,
      totalSpent: totalValuePurchased,
      lastOrderDate:
        items.length > 0
          ? new Date(
              Math.max(
                ...items.map((item) => item.purchaseDate?.getTime() || 0)
              )
            )
          : null,
    },
  };

  return response;
}

/**
 * Utility function to group stock history by product
 * Can be used for product-centric aggregation reports
 */
export function groupSupplierHistoryByProduct(
  historyItems: SupplierStockHistoryItem[]
): Record<string, {
  productId: string;
  productName: string;
  productSku: string | null;
  totalQuantityPurchased: number;
  totalValuePurchased: number;
  averagePricePerUnit: number;
  quantityRemaining: number;
  batches: SupplierStockHistoryItem[];
}> {
  const groupedByProduct: Record<string, any> = {};
  
  historyItems.forEach(item => {
    if (!groupedByProduct[item.productId]) {
      groupedByProduct[item.productId] = {
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        totalQuantityPurchased: 0,
        totalValuePurchased: 0,
        quantityRemaining: 0,
        batches: []
      };
    }
    
    const group = groupedByProduct[item.productId];
    group.totalQuantityPurchased += item.quantityPurchased;
    group.totalValuePurchased += item.quantityPurchased * item.buyingPricePerUnit;
    group.quantityRemaining += item.quantityRemaining;
    group.batches.push(item);
  });
  
  // Calculate average price for each product
  Object.values(groupedByProduct).forEach((group) => {
    group.averagePricePerUnit = group.totalQuantityPurchased > 0 
      ? group.totalValuePurchased / group.totalQuantityPurchased 
      : 0;
  });
  
  return groupedByProduct;
}