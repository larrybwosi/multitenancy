"use server";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  ProductInput,
  ProductInputSchema,
} from "@/lib/validations/product";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Product, ProductWithCategory } from "@/lib/types";
import { auth } from "@/lib/auth";
import { AuditAction, AuditResource } from "@/lib/logging/audit-types";
import { logAuditEvent } from "@/lib/logging/audit-logger";


// Adapter to convert Prisma Product to our custom Product type
function adaptProduct(product: ProductWithCategory): any {
  return {
    id: product.id.toString(),
    name: product.name,
    price: product.price,
    category: {
      id: product.category_id.toString(),
      name: product.category?.name || "Uncategorized",
    },
    image: product.image_url || undefined,
    stock: product.stock,
    sku: product.sku || undefined,
    description: product.description || undefined,
    barcode: product.barcode || undefined,
    // Add any other fields needed
  };
}

export async function getProducts(): Promise<Product[]> {
  try {
    const products = await db.product.findMany({
      include: {
        category: true,
      },
    });
    return products.map(adaptProduct);
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const product = await db.product.findUnique({
      where: { id: id },
      include: {
        category: true,
      },
    });

    if (!product) return null;
    return adaptProduct(product);
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    return null;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const products = await db.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          // { barcode: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        category: true,
      },
    });

    return products.map(adaptProduct);
  } catch (error) {
    console.error(`Error searching products for "${query}":`, error);
    return [];
  }
}

// export async function getProductByBarcode(barcode: string) {
//   return await db.product.findUnique({
//     where: { barcode },
//   });
// }

export async function createProduct(product: ProductInput) {
  try {
    const validatedProduct = ProductInputSchema.parse(product);

    const { categoryId, ...rest } = validatedProduct;
    const org = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    const result = await db.product.create({
      data: {
        ...rest,
        category: {
          connect: {
            id: categoryId,
          },
        },
        org: {
          connect: {
            id: org.id,
          },
        },
      },
    });

    await logAuditEvent({
      action: AuditAction.CREATE_PRODUCT,
      resource: AuditResource.PRODUCT,
      resourceId: result.id,
      details: {
        product: result,
      },
    });

    revalidatePath("/api/products");
    revalidatePath("/products");
    revalidatePath("/pos");

    return result;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("A product with this SKU or barcode already exists");
      }
    }
    throw error;
  }
}

export async function updateProduct(
  id: string,
  product: Partial<ProductInput>
) {
  const result = await db.product.update({
    where: { id },
    data: {
      ...product,
      updatedAt: new Date(),
    },
  });

  await logAuditEvent({
    action: AuditAction.UPDATE_PRODUCT,
    resource: AuditResource.PRODUCT,
    resourceId: id,
    details: {
      before: await getProductById(id.toString()),
      after: result,
      changes: product,
    },
  });
  return result;
}

export async function deleteProduct(id: string) {
  const result = await db.product.delete({
    where: { id },
  });
  revalidatePath("/products");
  revalidatePath("/pos");
  return result;
}


export async function getProductDetails(productId: string, organisationId: string) {
  // Get product base information
  const product = await db.product.findUnique({
    where: { id: productId, organisationId },
    include: {
      category: true,
      stockEntries: true,
    },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  // Get all stock transactions for this product
  const transactions = await db.stockTransaction.findMany({
    where: { productId, organisationId },
  });

  // Get all order items for this product
  const orderItems = await db.orderItem.findMany({
    where: { productId },
    include: {
      order: {
        select: {
          status: true,
          createdAt: true,
        },
      },
    },
  });

  // Calculate metrics
  const totalQuantityPurchased = transactions
    .filter(t => t.type === 'PURCHASE')
    .reduce((sum, t) => sum + Number(t.quantityChange), 0);

  const totalQuantitySold = orderItems
    .filter(oi => oi.order.status === 'COMPLETED' || oi.order.status === 'DELIVERED')
    .reduce((sum, oi) => sum + Number(oi.quantity), 0);

  const remainingInStock = product.stockEntries
    .reduce((sum, stock) => sum + Number(stock.quantityAvailable), 0);

  const totalStockValuation = product.stockEntries
    .reduce((sum, stock) => sum + (Number(stock.quantityAvailable) * Number(stock.buyingPricePerUnit)), 0);

  const totalSales = orderItems
    .filter(oi => oi.order.status === 'COMPLETED' || oi.order.status === 'DELIVERED')
    .reduce((sum, oi) => sum + Number(oi.totalPrice), 0);

  const totalCostOfGoodsSold = orderItems
    .filter(oi => oi.order.status === 'COMPLETED' || oi.order.status === 'DELIVERED')
    .reduce((sum, oi) => {
      // This is a simplified calculation - in a real system you'd track which specific stock was sold
      const averageCost = product.stockEntries.length > 0 
        ? product.stockEntries.reduce((sum, stock) => sum + Number(stock.buyingPricePerUnit), 0) / product.stockEntries.length
        : 0;
      return sum + (Number(oi.quantity) * averageCost);
    }, 0);

  const totalProfit = totalSales - totalCostOfGoodsSold;

  // Get expiry information
  const expiringSoon = product.stockEntries.filter(stock => 
    stock.expiryDate && 
    new Date(stock.expiryDate) > new Date() && 
    new Date(stock.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  );

  const expiredStock = product.stockEntries.filter(stock => 
    stock.expiryDate && new Date(stock.expiryDate) < new Date()
  );

  return {
    productInfo: {
      id: product.id,
      name: product.name,
      description: product.description,
      sku: product.sku,
      category: product.category?.name || null,
      type: product.type,
      unit: product.unit,
      currentSellingPrice: product.currentSellingPrice,
      isActive: product.isActive,
    },
    stockInfo: {
      totalQuantityPurchased,
      totalQuantitySold,
      remainingInStock,
      totalStockValuation,
      expiringSoonCount: expiringSoon.length,
      expiredCount: expiredStock.length,
      stockEntries: product.stockEntries.map((async(stock) => ({
        id: stock.id,
        batchNumber: stock.batchNumber,
        quantityAvailable: stock.quantityAvailable,
        buyingPricePerUnit: stock.buyingPricePerUnit,
        purchaseDate: stock.purchaseDate,
        expiryDate: stock.expiryDate,
        daysUntilExpiry: stock.expiryDate 
          ? Math.floor((new Date(stock.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        isExpired: stock.expiryDate ? new Date(stock.expiryDate) < new Date() : false,
        supplier: stock.supplierId ? await db.supplier.findUnique({
          where: { id: stock.supplierId },
          select: { name: true, id: true }
        }) : null,
      }))),
    },
    salesInfo: {
      totalSales,
      totalCostOfGoodsSold,
      totalProfit,
      profitMargin: totalSales > 0 ? (totalProfit / totalSales) * 100 : 0,
      salesCount: orderItems.filter(oi => 
        oi.order.status === 'COMPLETED' || oi.order.status === 'DELIVERED'
      ).length,
      orderItems: orderItems.map(oi => ({
        orderId: oi.orderId,
        quantity: oi.quantity,
        unitPriceAtSale: oi.unitPriceAtSale,
        totalPrice: oi.totalPrice,
        orderStatus: oi.order.status,
        orderDate: oi.order.createdAt,
      })),
    },
    transactions: transactions.map(t => ({
      id: t.id,
      type: t.type,
      quantityChange: t.quantityChange,
      transactionDate: t.transactionDate,
      reason: t.reason,
      relatedOrderId: t.relatedOrderId,
      createdById: t.createdById,
    })),
  };
}