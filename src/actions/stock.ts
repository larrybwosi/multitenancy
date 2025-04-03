import { Prisma, PrismaClient } from "@prisma/client";
import {
  ApiResponse,
  PaginationParams,
  FilterParams,
  ProductWithInventory,
  ProductWithCategory,
  StockTransaction as DBStockTransaction
} from "@/lib/types";
import { StockTransaction } from "@/app/stock/types";

const prisma = new PrismaClient();

export async function getProducts(
  organizationId: string,
  locationId?: number,
  params?: PaginationParams & FilterParams
): Promise<ApiResponse<ProductWithInventory[]>> {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "name",
      sortOrder = "asc",
      search,
      categoryId,
    } = params || {};

    // Build filter conditions
    const where: Prisma.ProductWhereInput = {
      orgId: organizationId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(categoryId && { categoryId: Number(categoryId) }),
    };


    // Count total results for pagination
    const total = await prisma.product.count({ where });

    // Get products with their inventory information
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        locationInventory: locationId ? { where: { locationId } } : true,
        variants: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      data: products as ProductWithInventory[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error getting products:", error);
    return {
      success: false,
      error: "Failed to retrieve products",
    };
  }
}


export async function getLowStockItems(
  organizationId: string,
  locationId?: number,
  limit = 10
): Promise<ApiResponse<ProductWithCategory[]>> {
  try {
    // Get products that are below their minimum stock level
    const lowStockProducts = await prisma.product.findMany({
      where: {
        orgId:organizationId,
        // Only include products that have a min_stock_level set
        min_stock_level: { not: null },
        // For location-specific low stock
        ...(locationId
          ? {
              locationInventory: {
                some: {
                  locationId,
                  quantity: {
                    lt: { $expr: { $ifNull: ["$min_stock_level", 0] } },
                  },
                },
              },
            }
          : {
              // For global low stock (sum across all locations)
              locationInventory: {
                every: {
                  quantity: {
                    lt: { $expr: { $ifNull: ["$min_stock_level", 0] } },
                  },
                },
              },
            }),
      },
      include: {
        category: true,
        locationInventory: locationId ? { where: { locationId } } : true,
      },
      orderBy: {
        min_stock_level: "asc",
      },
      take: limit,
    });

    return {
      success: true,
      data: lowStockProducts as unknown as ProductWithCategory[],
    };
  } catch (error) {
    console.error("Error getting low stock items:", error);
    return {
      success: false,
      error: "Failed to retrieve low stock items",
    };
  }
}


export async function getStockTransactions(
  organizationId: string,
  params?: PaginationParams &
    FilterParams & {
      productId?: number;
      transactionType?: string;
    }
): Promise<ApiResponse<DBStockTransaction[]>> {
  try {

    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      dateFrom,
      dateTo,
      productId,
      transactionType,
      locationId,
    } = params || {};

    // Build filter conditions
    const where: Prisma.StockTransactionWhereInput = {
      orgId: organizationId,
      ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
      ...(dateTo && { createdAt: { lte: new Date(dateTo) } }),
      ...(productId && { productId: Number(productId) }),
      ...(transactionType && { type: transactionType }),
      ...(locationId && { location: { id: Number(locationId) } }), // Changed to use location relation
    };

    // Count total results for pagination
    const total = await prisma.stockTransaction.count({ where });

    // Get stock transactions
    const transactions = await prisma.stockTransaction.findMany({
      where,
      include: {
        product: true,
        supplier: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      data: transactions as DBStockTransaction[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error getting stock transactions:", error);
    return {
      success: false,
      error: "Failed to retrieve stock transactions",
    };
  }
}

export async function getInventoryOverview(
  organizationId: string,
  locationId?: number
): Promise<
  ApiResponse<{
    totalItems: number;
    totalValue: number;
    potentialProfit: number;
    lowStockCount: number;
    outOfStockCount: number;
    inventoryByCategory: {
      categoryId: number;
      categoryName: string;
      itemCount: number;
      totalValue: number;
    }[];
    recentTransactions: StockTransaction[];
  }>
> {
  try {
    // Get all products with their inventory information
    const products = await prisma.product.findMany({
      where: {
        orgId: organizationId,
        isActive: true,
      },
      include: {
        category: true,
        locationInventory: locationId ? { where: { locationId } } : true,
      },
    });

    // Calculate inventory metrics
    let totalItems = 0;
    let totalValue = 0;
    let potentialProfit = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    // Group by category for the category breakdown
    const categoryMap = new Map<number, {
      categoryId: number;
      categoryName: string;
      itemCount: number;
      totalValue: number;
    }>();

    products.forEach((product) => {
      // For location-specific inventory, use the quantity at that location
      // Otherwise use the product's global stock value
      let stockQuantity = 0;
      
      if (locationId) {
        stockQuantity = product.locationInventory.reduce(
          (sum, inv) => sum + inv.stock,
          0
        );
      } else {
        stockQuantity = product.stock;
      }

      // Calculate product value
      const productValue = stockQuantity * (product.purchase_price || 0);
      
      // Calculate potential profit
      const potentialSaleValue = stockQuantity * product.price;
      const productProfit = potentialSaleValue - productValue;

      // Add to totals
      totalItems += stockQuantity;
      totalValue += productValue;
      potentialProfit += productProfit;

      // Check stock status
      if (stockQuantity === 0) {
        outOfStockCount++;
      } else if (product.min_stock_level && stockQuantity < product.min_stock_level) {
        lowStockCount++;
      }

      // Add to category breakdown
      const categoryId = product.category_id;
      const categoryName = product.category.name;

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName,
          itemCount: 0,
          totalValue: 0,
        });
      }

      const categoryData = categoryMap.get(categoryId)!;
      categoryData.itemCount += stockQuantity;
      categoryData.totalValue += productValue;
    });

    // Get recent transactions
    const recentTransactions = await prisma.stockTransaction.findMany({
      where: {
        orgId: organizationId,
      },
      include: {
        product: true,
        supplier: true,
      },
      orderBy: {
        transaction_date: 'desc',
      },
      take: 10,
    });

    // Transform transactions to match the expected format
    const formattedTransactions: StockTransaction[] = recentTransactions.map(transaction => {
      // Access properties directly from the transaction object
      return {
        id: transaction.id,
        productId: transaction.product_id,
        productName: transaction.product.name,
        transactionType: transaction.transaction_type as string,
        quantity: transaction.quantity,
        unitPrice: transaction.unit_price,
        totalAmount: transaction.total_amount,
        direction: transaction.direction as "IN" | "OUT",
        transactionDate: transaction.transaction_date,
        notes: transaction.notes,
        supplierName: transaction.supplier?.name || null,
        createdBy: transaction.createdBy,
        attachments: [] // Attachments would need a separate query if needed
      };
    });

    return {
      success: true,
      data: {
        totalItems,
        totalValue,
        potentialProfit,
        lowStockCount,
        outOfStockCount,
        inventoryByCategory: Array.from(categoryMap.values()),
        recentTransactions: formattedTransactions,
      },
    };
  } catch (error) {
    console.error("Error getting inventory overview:", error);
    return {
      success: false,
      error: "Failed to retrieve inventory overview",
    };
  }
}

export async function getInventoryByLocation(organizationId: string): Promise<
  ApiResponse<
    {
      locationId: number;
      locationName: string;
      totalItems: number;
      totalValue: number;
    }[]
  >
> {
  try {
    // Get all locations for this organization
    const locations = await prisma.location.findMany({
      where: { orgId: organizationId },
      include: {
        inventory: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate inventory metrics per location
    const inventoryByLocation = locations.map((location) => {
      const totalItems = location.inventory.reduce(
        (sum, inv) => sum + inv.quantity,
        0
      );

      const totalValue = location.inventory.reduce(
        (sum, inv) => sum + inv.quantity * (inv.product.purchase_price || 0),
        0
      );

      return {
        locationId: location.id,
        locationName: location.name,
        totalItems,
        totalValue,
      };
    });

    return {
      success: true,
      data: inventoryByLocation,
    };
  } catch (error) {
    console.error("Error getting inventory by location:", error);
    return {
      success: false,
      error: "Failed to retrieve inventory by location",
    };
  }
}

/**
 * Get products with their inventory information for the InventoryTab component
 */
export async function getInventoryProducts(
  organizationId: string,
  params?: PaginationParams & FilterParams
): Promise<ApiResponse<ProductWithInventory[]>> {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "name",
      sortOrder = "asc",
      search,
      categoryId,
    } = params || {};

    // Build filter conditions
    const where: Prisma.ProductWhereInput = {
      orgId: organizationId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(categoryId && { category_id: Number(categoryId) }),
    };

    // Count total results for pagination
    const total = await prisma.product.count({ where });

    // Get products with their inventory information
    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        locationInventory: true,
        variants: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      data: products as unknown as ProductWithInventory[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error getting inventory products:", error);
    return {
      success: false,
      error: "Failed to retrieve inventory products",
    };
  }
}

/**
 * Get stock transactions for the TransactionsTab component
 */
export async function getStockTransactionsForTab(
  organizationId: string,
  params?: PaginationParams & FilterParams & {
    productId?: number;
    transactionType?: string;
    dateRange?: [Date, Date];
  }
): Promise<ApiResponse<StockTransaction[]>> {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "transactionDate",
      sortOrder = "desc",
      dateFrom,
      dateTo,
      productId,
      transactionType,
    } = params || {};

    // Build filter conditions
    const where: Prisma.StockTransactionWhereInput = {
      orgId: organizationId,
      ...(dateFrom && { transaction_date: { gte: new Date(dateFrom) } }),
      ...(dateTo && { transaction_date: { lte: new Date(dateTo) } }),
      ...(productId && { product_id: Number(productId) }),
      ...(transactionType && { transaction_type: transactionType }),
    };

    // Count total results for pagination
    const total = await prisma.stockTransaction.count({ where });

    // Get stock transactions
    const dbTransactions = await prisma.stockTransaction.findMany({
      where,
      include: {
        product: true,
        supplier: true,
      },
      orderBy: { 
        // Map frontend sortBy fields to DB field names
        ...(sortBy === 'transactionDate' 
          ? { transaction_date: sortOrder } 
          : { [sortBy]: sortOrder })
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform DB transactions to the expected frontend format
    const transactions: StockTransaction[] = dbTransactions.map(transaction => ({
      id: transaction.id,
      productId: transaction.product_id,
      productName: transaction.product.name,
      transactionType: transaction.transaction_type as string,
      quantity: transaction.quantity,
      unitPrice: transaction.unit_price,
      totalAmount: transaction.total_amount,
      direction: transaction.direction as "IN" | "OUT",
      transactionDate: transaction.transaction_date,
      notes: transaction.notes,
      supplierName: transaction.supplier?.name || null,
      createdBy: transaction.createdBy,
      attachments: [],
    }));

    return {
      success: true,
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error getting stock transactions:", error);
    return {
      success: false,
      error: "Failed to retrieve stock transactions",
    };
  }
}
