import { Prisma, PrismaClient } from "@prisma/client";
import {
  ApiResponse,
  PaginationParams,
  FilterParams,
  ProductWithInventory,
  ProductWithCategory,
  StockTransaction,
  InventoryByLocation,
} from "@/lib/types";

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
  organizationId: number,
  locationId?: number,
  limit = 10
): Promise<ApiResponse<ProductWithCategory[]>> {
  try {
    // Get products that are below their minimum stock level
    const lowStockProducts = await prisma.product.findMany({
      where: {
        organizationId,
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
      } as any,
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
): Promise<ApiResponse<StockTransaction[]>> {
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
      data: transactions as StockTransaction[],
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
    const categoryMap = new Map();

    products.forEach((product) => {
      // Calculate total quantity across locations or at specific location
      const totalQuantity = product.locationInventory.reduce(
        (sum, inv) => sum + inv.quantity,
        0
      );

      // Update metrics
      totalItems += totalQuantity;
      const productValue = totalQuantity * (product.purchase_price || 0);
      totalValue += productValue;

      // Calculate potential profit (selling price - purchase price) * quantity
      const potentialProfitForProduct =
        totalQuantity * ((product.price || 0) - (product.purchase_price || 0));
      potentialProfit += potentialProfitForProduct;

      // Check if low stock or out of stock
      if (totalQuantity === 0) {
        outOfStockCount++;
      } else if (
        product.min_stock_level !== null &&
        totalQuantity < product.min_stock_level
      ) {
        lowStockCount++;
      }

      // Update category data
      if (product.category) {
        const categoryId = product.category.id;
        const categoryName = product.category.name;

        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            categoryId,
            categoryName,
            itemCount: 0,
            totalValue: 0,
          });
        }

        const categoryData = categoryMap.get(categoryId);
        categoryData.itemCount += totalQuantity;
        categoryData.totalValue += productValue;
      }
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
