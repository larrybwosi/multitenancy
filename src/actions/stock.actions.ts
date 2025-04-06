"use server";

import {
  Prisma,
  Stock,
  StockTransaction,
  StockTransactionType,
} from "@prisma/client";
import { db as prisma } from "@/lib/db";


// --- Helper Types ---

interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string>; // For specific field errors
}

interface StockOverviewData {
  organizationId: string;
  totalStockQuantity: Prisma.Decimal;
  totalStockValue: Prisma.Decimal;
  numberOfProducts: number;
  numberOfProductsWithStock: number; // Number of distinct products that currently have stock > 0
  potentialProfitOnCurrentStock: Prisma.Decimal;
  mostSoldProduct?: {
    productId: string;
    name: string | null;
    totalSold: Prisma.Decimal;
  };
  highestRevenueProduct?: {
    productId: string;
    name: string | null;
    totalRevenue: Prisma.Decimal;
  };
  productWithHighestPotentialProfit?: {
    productId: string;
    name: string | null;
    potentialProfit: Prisma.Decimal;
  };
  lowStockProducts: {
    productId: string;
    name: string | null;
    quantity: Prisma.Decimal;
  }[];
  expiringSoonStock: {
    stockId: string;
    productId: string;
    productName: string | null;
    batchNumber: string | null;
    quantity: Prisma.Decimal;
    expiryDate: Date;
  }[];
  totalSpoiledValueEstimate: Prisma.Decimal; // Estimate based on available stock costs
}

// --- Authorization Placeholder ---
// Replace this with your actual authorization logic
async function checkUserAuthorization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  // Example: Check if user is a member of the organization
  const member = await prisma.member.findUnique({
    where: {
      userId_organizationId: {
        userId: userId,
        organizationId: organizationId,
      },
    },
  });
  // Add role checks if needed (e.g., allow only admin/staff)
  return !!member;
  // return true; // Placeholder - REMOVE IN PRODUCTION
}

// --- Overview Function ---

/**
 * Provides a comprehensive overview of the stock for a given organization.
 * @param organizationId - The ID of the organization.
 * @param userId - The ID of the user performing the action (for authorization).
 * @param lowStockThreshold - The quantity threshold below which a product is considered low stock (default: 10).
 * @param expiringSoonDays - The number of days within which stock is considered expiring soon (default: 30).
 */
export async function getStockOverview(
  organizationId: string,
  userId: string, // Needed for authorization check
  lowStockThreshold: number = 10,
  expiringSoonDays: number = 30
): Promise<ActionResponse<StockOverviewData>> {
  // TODO: Implement proper authorization check
  if (!(await checkUserAuthorization(userId, organizationId))) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // --- Calculate Core Metrics ---
    const stockAggregations = await prisma.stock.aggregate({
      _sum: {
        quantityAvailable: true,
      },
      where: {
        organizationId: organizationId,
        quantityAvailable: { gt: 0 }, // Only consider stock with quantity > 0 for value/profit
      },
    });

    const allStockEntries = await prisma.stock.findMany({
      where: {
        organizationId: organizationId,
        quantityAvailable: { gt: 0 },
      },
      include: { product: true }, // Include product for selling price
    });

    const totalStockQuantity =
      stockAggregations._sum.quantityAvailable ?? new Prisma.Decimal(0);
    const totalStockValue = allStockEntries.reduce((sum, stock) => {
      return sum.add(stock.quantityAvailable.mul(stock.buyingPricePerUnit));
    }, new Prisma.Decimal(0));

    const potentialProfitOnCurrentStock = allStockEntries.reduce(
      (sum, stock) => {
        const profitPerUnit = stock.product.currentSellingPrice.sub(
          stock.buyingPricePerUnit
        );
        // Only add if selling price is higher than buying price
        if (profitPerUnit.gt(0)) {
          return sum.add(stock.quantityAvailable.mul(profitPerUnit));
        }
        return sum;
      },
      new Prisma.Decimal(0)
    );

    const productCount = await prisma.product.count({
      where: { organizationId: organizationId, isActive: true },
    });

    const productsWithStockCount = await prisma.stock.groupBy({
      by: ["productId"],
      where: { organizationId: organizationId, quantityAvailable: { gt: 0 } },
      _sum: { quantityAvailable: true },
    });
    const numberOfProductsWithStock = productsWithStockCount.length;

    // --- Calculate Most Sold Product ---
    // Note: Sums absolute value of quantityChange for SALES
    const salesTransactions = await prisma.stockTransaction.groupBy({
      by: ["productId"],
      _sum: {
        quantityChange: true, // Sums the negative changes
      },
      where: {
        organizationId: organizationId,
        type: StockTransactionType.SALE,
      },
      orderBy: {
        _sum: {
          quantityChange: "asc", // Most negative sum means most sold
        },
      },
      take: 1,
    });

    let mostSoldProductData: StockOverviewData["mostSoldProduct"] = undefined;
    if (
      salesTransactions.length > 0 &&
      salesTransactions[0]._sum.quantityChange
    ) {
      const topProductId = salesTransactions[0].productId;
      const productInfo = await prisma.product.findUnique({
        where: { id: topProductId },
        select: { name: true },
      });
      mostSoldProductData = {
        productId: topProductId,
        name: productInfo?.name ?? "Unknown Product",
        totalSold: salesTransactions[0]._sum.quantityChange.abs(), // Absolute value
      };
    }

    // --- Calculate Highest Revenue Generating Product ---
    const revenueData = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: {
        totalPrice: true, // Sum of (quantity * unitPriceAtSale)
      },
      where: {
        order: {
          organizationId: organizationId,
          // Optionally filter by completed/paid orders
          // status: { in: [OrderStatus.COMPLETED, OrderStatus.PAID, OrderStatus.DELIVERED, OrderStatus.SHIPPED]}
        },
      },
      orderBy: {
        _sum: {
          totalPrice: "desc",
        },
      },
      take: 1,
    });

    let highestRevenueProductData: StockOverviewData["highestRevenueProduct"] =
      undefined;
    if (revenueData.length > 0 && revenueData[0]._sum.totalPrice) {
      const topRevenueProductId = revenueData[0].productId;
      const productInfo = await prisma.product.findUnique({
        where: { id: topRevenueProductId },
        select: { name: true },
      });
      highestRevenueProductData = {
        productId: topRevenueProductId,
        name: productInfo?.name ?? "Unknown Product",
        totalRevenue: revenueData[0]._sum.totalPrice,
      };
    }

    // --- Calculate Product with Highest Potential Profit ---
    let highestPotentialProfitProductData: StockOverviewData["productWithHighestPotentialProfit"] =
      undefined;
    if (allStockEntries.length > 0) {
      const profitByProduct = allStockEntries.reduce((acc, stock) => {
        const profitPerUnit = stock.product.currentSellingPrice.sub(
          stock.buyingPricePerUnit
        );
        if (profitPerUnit.gt(0)) {
          const potentialProfit = stock.quantityAvailable.mul(profitPerUnit);
          const current = acc.get(stock.productId) ?? {
            name: stock.product.name,
            profit: new Prisma.Decimal(0),
          };
          current.profit = current.profit.add(potentialProfit);
          acc.set(stock.productId, current);
        }
        return acc;
      }, new Map<string, { name: string | null; profit: Prisma.Decimal }>());

      let maxProfit = new Prisma.Decimal(-Infinity);
      let maxProductId = "";
      let maxProductName: string | null = null;

      profitByProduct.forEach((data, productId) => {
        if (data.profit.gt(maxProfit)) {
          maxProfit = data.profit;
          maxProductId = productId;
          maxProductName = data.name;
        }
      });

      if (maxProductId) {
        highestPotentialProfitProductData = {
          productId: maxProductId,
          name: maxProductName ?? "Unknown Product",
          potentialProfit: maxProfit,
        };
      }
    }

    // --- Find Low Stock Products ---
    const productStockLevels = await prisma.stock.groupBy({
      by: ["productId"],
      _sum: {
        quantityAvailable: true,
      },
      where: {
        organizationId: organizationId,
      },
    });

    const lowStockProductIds = productStockLevels
      .filter((p) =>
        (p._sum.quantityAvailable ?? new Prisma.Decimal(0)).lte(lowStockThreshold)
      )
      .map((p) => p.productId);

    const lowStockProductsDetails = await prisma.product.findMany({
      where: {
        id: { in: lowStockProductIds },
        organizationId: organizationId, // Ensure correct org
      },
      select: { id: true, name: true },
    });

    const lowStockProductsResult = lowStockProductsDetails.map((p) => {
      const stockLevel = productStockLevels.find(
        (psl) => psl.productId === p.id
      );
      return {
        productId: p.id,
        name: p.name,
        quantity: stockLevel?._sum.quantityAvailable ?? new Prisma.Decimal(0),
      };
    });

    // --- Find Expiring Soon Stock ---
    const soonExpiryDate = new Date();
    soonExpiryDate.setDate(soonExpiryDate.getDate() + expiringSoonDays);

    const expiringStock = await prisma.stock.findMany({
      where: {
        organizationId: organizationId,
        expiryDate: {
          lte: soonExpiryDate, // Less than or equal to the future date
          gte: new Date(), // Greater than or equal to today (not already expired)
        },
        quantityAvailable: { gt: 0 },
      },
      include: {
        product: { select: { name: true } },
      },
      orderBy: {
        expiryDate: "asc",
      },
    });

    const expiringSoonStockResult = expiringStock.map((s) => ({
      stockId: s.id,
      productId: s.productId,
      productName: s.product.name,
      batchNumber: s.batchNumber,
      quantity: s.quantityAvailable,
      expiryDate: s.expiryDate!, // We know it's not null from the query
    }));

    // --- Estimate Total Spoiled Value ---
    // This requires knowing the buying price of the *specific* stock that was spoiled.
    // We look for SPOILAGE transactions WITH a stockId link.
    const spoilageTransactions = await prisma.stockTransaction.findMany({
      where: {
        organizationId: organizationId,
        type: StockTransactionType.SPOILAGE,
        stockId: { not: null }, // Crucial: Need the link to get cost
      },
      include: {
        stock: {
          // Include the related stock batch (even if quantity is now 0)
          select: { buyingPricePerUnit: true },
        },
      },
    });

    const totalSpoiledValueEstimate = spoilageTransactions.reduce((sum, tx) => {
      // If the linked stock entry was deleted or somehow unavailable, skip
      if (tx.stock) {
        const quantitySpoiled = tx.quantityChange.abs(); // Quantity is negative in tx
        const value = quantitySpoiled.mul(tx.stock.buyingPricePerUnit);
        return sum.add(value);
      }
      // Add a note in real logs if tx.stock is null - data integrity issue
      console.warn(
        `Could not calculate spoiled value for StockTransaction ${tx.id} due to missing linked Stock data.`
      );
      return sum;
    }, new Prisma.Decimal(0));

    // --- Assemble Overview Data ---
    const overviewData: StockOverviewData = {
      organizationId,
      totalStockQuantity,
      totalStockValue,
      numberOfProducts: productCount,
      numberOfProductsWithStock,
      potentialProfitOnCurrentStock,
      mostSoldProduct: mostSoldProductData,
      highestRevenueProduct: highestRevenueProductData,
      productWithHighestPotentialProfit: highestPotentialProfitProductData,
      lowStockProducts: lowStockProductsResult,
      expiringSoonStock: expiringSoonStockResult,
      totalSpoiledValueEstimate,
    };

    return { success: true, data: overviewData };
  } catch (error) {
    console.error("Error generating stock overview:", error);
    // Consider more specific error handling or logging
    return { success: false, error: "Failed to generate stock overview." };
  }
}

// --- Stock CRUD Actions ---

interface AddStockBatchInput {
  organizationId: string;
  productId: string;
  quantity: string | number | Prisma.Decimal; // Allow string/number for flexibility, convert to Prisma.Decimal
  buyingPricePerUnit: string | number | Prisma.Decimal;
  unit: string; // Should ideally validate against Product.unit
  supplierId?: string;
  batchNumber?: string;
  purchaseDate?: Date | string; // Allow string for flexibility
  expiryDate?: Date | string | null;
  notes?: string;
  userId: string; // User performing the action
}

/**
 * Adds a new batch of stock and creates a corresponding PURCHASE transaction.
 * Uses Prisma transaction for atomicity.
 */
export async function addStockBatch(
  input: AddStockBatchInput
): Promise<ActionResponse<{ stock: Stock; transaction: StockTransaction }>> {
  // TODO: Implement proper authorization check
  // if (!(await checkUserAuthorization(input.userId, input.organizationId))) {
  //   return { success: false, error: "Unauthorized" };
  // }

  try {
    const quantityDecimal = new Prisma.Decimal(input.quantity);
    const buyingPriceDecimal = new Prisma.Decimal(input.buyingPricePerUnit);

    if (quantityDecimal.lte(0)) {
      return { success: false, error: "Quantity must be positive." };
    }
    if (buyingPriceDecimal.lt(0)) {
      return { success: false, error: "Buying price cannot be negative." };
    }

    // Validate product exists and belongs to the organization
    const product = await prisma.product.findUnique({
      where: { id: input.productId, organizationId: input.organizationId },
    });
    if (!product) {
      return {
        success: false,
        error: `Product with ID ${input.productId} not found in this organization.`,
      };
    }
    // Optional: Validate input.unit matches product.unit
    if (input.unit !== product.unit) {
      console.warn(
        `Stock batch unit '${input.unit}' differs from product unit '${product.unit}' for product ${input.productId}`
      );
      // Decide whether to return error or just warn based on requirements
      // return { success: false, error: `Unit mismatch: Expected '${product.unit}', got '${input.unit}'.` };
    }

    // Validate supplier if provided
    if (input.supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: input.supplierId, organizationId: input.organizationId },
      });
      if (!supplier) {
        return {
          success: false,
          error: `Supplier with ID ${input.supplierId} not found in this organization.`,
        };
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const newStock = await tx.stock.create({
        data: {
          organizationId: input.organizationId,
          productId: input.productId,
          quantityAvailable: quantityDecimal,
          buyingPricePerUnit: buyingPriceDecimal,
          unit: input.unit, // Store the unit provided for the batch
          supplierId: input.supplierId,
          batchNumber: input.batchNumber,
          purchaseDate: input.purchaseDate
            ? new Date(input.purchaseDate)
            : new Date(),
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
          notes: input.notes,
        },
      });

      const newTransaction = await tx.stockTransaction.create({
        data: {
          organizationId: input.organizationId,
          productId: input.productId,
          stockId: newStock.id, // Link to the specific batch created
          type: StockTransactionType.PURCHASE,
          quantityChange: quantityDecimal, // Positive for purchase
          createdById: input.userId,
          transactionDate: new Date(),
          reason: "Initial batch purchase/restock", // Default reason
        },
      });

      return { stock: newStock, transaction: newTransaction };
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error adding stock batch:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors if needed (e.g., unique constraint violation)
      return { success: false, error: `Database error: ${error.code}` };
    }
    return { success: false, error: "Failed to add stock batch." };
  }
}

interface UpdateStockBatchInput {
  stockId: string;
  organizationId: string;
  userId: string; // User performing action
  // Fields allowed to update directly (Quantity is updated via transactions)
  buyingPricePerUnit?: string | number | Prisma.Decimal;
  batchNumber?: string | null;
  purchaseDate?: Date | string | null;
  expiryDate?: Date | string | null;
  notes?: string | null;
  supplierId?: string | null; // Allow updating/removing supplier link
}

/**
 * Updates non-quantity details of a specific stock batch.
 * Quantity updates MUST go through transaction actions (adjustment, sale, etc.).
 */
export async function updateStockBatchDetails(
  input: UpdateStockBatchInput
): Promise<ActionResponse<Stock>> {
  // TODO: Implement proper authorization check
  // if (!(await checkUserAuthorization(input.userId, input.organizationId))) {
  //   return { success: false, error: "Unauthorized" };
  // }

  try {
    // Ensure the stock batch exists and belongs to the organization
    const existingStock = await prisma.stock.findUnique({
      where: { id: input.stockId, organizationId: input.organizationId },
    });
    if (!existingStock) {
      return {
        success: false,
        error: `Stock batch with ID ${input.stockId} not found.`,
      };
    }

    // Prepare update data, converting types as needed
    const updateData: Prisma.StockUpdateInput = {};
    if (input.buyingPricePerUnit !== undefined) {
      const price = new Prisma.Decimal(input.buyingPricePerUnit);
      if (price.lt(0)) {
        return { success: false, error: "Buying price cannot be negative." };
      }
      updateData.buyingPricePerUnit = price;
    }
    if (input.batchNumber !== undefined)
      updateData.batchNumber = input.batchNumber;
    if (input.purchaseDate !== undefined)
      updateData.purchaseDate = input.purchaseDate
        ? new Date(input.purchaseDate)
        : null;
    if (input.expiryDate !== undefined)
      updateData.expiryDate = input.expiryDate
        ? new Date(input.expiryDate)
        : null;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.supplierId !== undefined) {
      // If setting a supplier, validate it exists in the org
      if (input.supplierId) {
        const supplier = await prisma.supplier.findUnique({
          where: { id: input.supplierId, organizationId: input.organizationId },
        });
        if (!supplier) {
          return {
            success: false,
            error: `Supplier with ID ${input.supplierId} not found.`,
          };
        }
      }
      updateData.supplier = input.supplierId
        ? { connect: { id: input.supplierId } }
        : { disconnect: true };
    }

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: "No valid fields provided for update." };
    }

    const updatedStock = await prisma.stock.update({
      where: { id: input.stockId },
      data: updateData,
    });

    return { success: true, data: updatedStock };
  } catch (error) {
    console.error("Error updating stock batch details:", error);
    return { success: false, error: "Failed to update stock batch details." };
  }
}

/**
 * Retrieves details for a specific stock batch.
 */
export async function getStockBatch(
  organizationId: string,
  stockId: string,
): Promise<ActionResponse<Stock>> {
  // TODO: Implement proper authorization check
  // if (!(await checkUserAuthorization(userId, organizationId))) {
  //   return { success: false, error: "Unauthorized" };
  // }
  try {
    const stock = await prisma.stock.findUnique({
      where: { id: stockId, organizationId: organizationId },
      include: { product: true, supplier: true }, // Include related data
    });
    if (!stock) {
      return { success: false, error: "Stock batch not found." };
    }
    return { success: true, data: stock };
  } catch (error) {
    console.error("Error getting stock batch:", error);
    return { success: false, error: "Failed to retrieve stock batch." };
  }
}

interface ListStockBatchesInput {
  organizationId: string;
  userId: string;
  productId?: string;
  supplierId?: string;
  expiringBefore?: Date | string;
  hasQuantity?: boolean; // Filter for batches with quantity > 0
  includeProduct?: boolean;
  includeSupplier?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Lists stock batches with optional filtering and pagination.
 */
export async function listStockBatches(
  input: ListStockBatchesInput
): Promise<ActionResponse<{ stockBatches: Stock[]; totalCount: number }>> {
  // TODO: Implement proper authorization check
  // if (!(await checkUserAuthorization(input.userId, input.organizationId))) {
  //   return { success: false, error: "Unauthorized" };
  // }
  try {
    const {
      organizationId,
      page = 1,
      pageSize = 20,
      includeProduct,
      includeSupplier,
      ...filters
    } = input;
    const skip = (page - 1) * pageSize;

    const where: Prisma.StockWhereInput = {
      organizationId: organizationId,
    };
    if (filters.productId) where.productId = filters.productId;
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.expiringBefore)
      where.expiryDate = { lte: new Date(filters.expiringBefore) };
    if (filters.hasQuantity) where.quantityAvailable = { gt: 0 };

    const [stockBatches, totalCount] = await prisma.$transaction([
      prisma.stock.findMany({
        where,
        include: {
          product: includeProduct ?? false,
          supplier: includeSupplier ?? false,
        },
        orderBy: { createdAt: "desc" }, // Or purchaseDate, expiryDate etc.
        skip: skip,
        take: pageSize,
      }),
      prisma.stock.count({ where }),
    ]);

    return { success: true, data: { stockBatches, totalCount } };
  } catch (error) {
    console.error("Error listing stock batches:", error);
    return { success: false, error: "Failed to list stock batches." };
  }
}

// --- Stock Transaction Actions ---

interface RecordAdjustmentInput {
  organizationId: string;
  userId: string;
  stockId: string; // Mandatory: Must adjust a specific batch
  quantityChange: string | number | Prisma.Decimal; // Positive for increase, Negative for decrease
  reason: string;
  transactionDate?: Date | string;
}

/**
 * Records a manual stock adjustment for a SPECIFIC batch and updates its quantity.
 * Uses Prisma transaction for atomicity.
 */
export async function recordStockAdjustment(
  input: RecordAdjustmentInput
): Promise<ActionResponse<{ stock: Stock; transaction: StockTransaction }>> {
  // TODO: Implement proper authorization check
  // if (!(await checkUserAuthorization(input.userId, input.organizationId))) {
  //   return { success: false, error: "Unauthorized" };
  // }

  try {
    const quantityChange = new Prisma.Decimal(input.quantityChange);

    if (quantityChange.isZero()) {
      return {
        success: false,
        error: "Quantity change cannot be zero for an adjustment.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find the stock batch to ensure it exists and belongs to the org
      const stock = await tx.stock.findUnique({
        where: { id: input.stockId, organizationId: input.organizationId },
        select: { id: true, productId: true, quantityAvailable: true }, // Select needed fields
      });

      if (!stock) {
        throw new Error(
          `Stock batch with ID ${input.stockId} not found in organization ${input.organizationId}.`
        );
      }

      // 2. Calculate the new quantity
      const newQuantity = stock.quantityAvailable.add(quantityChange);

      // 3. Check for negative stock (optional, based on business rules)
      if (newQuantity.isNegative()) {
        throw new Error(
          `Adjustment results in negative stock quantity (${newQuantity}) for batch ${input.stockId}.`
        );
      }

      // 4. Update the stock batch quantity
      const updatedStock = await tx.stock.update({
        where: { id: input.stockId },
        data: { quantityAvailable: newQuantity },
      });

      // 5. Create the stock transaction record
      const transaction = await tx.stockTransaction.create({
        data: {
          organizationId: input.organizationId,
          productId: stock.productId, // Get productId from the fetched stock
          stockId: input.stockId,
          type: StockTransactionType.ADJUSTMENT,
          quantityChange: quantityChange,
          reason: input.reason,
          createdById: input.userId,
          transactionDate: input.transactionDate
            ? new Date(input.transactionDate)
            : new Date(),
        },
      });

      return { stock: updatedStock, transaction };
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error recording stock adjustment:", error);
    return {
      success: false,
      error: error.message || "Failed to record stock adjustment.",
    };
  }
}

interface RecordSpoilageInput {
  organizationId: string;
  userId: string;
  stockId: string; // Mandatory: Must spoil a specific batch to know cost/details
  quantitySpoiled: string | number | Prisma.Decimal; // Positive number representing amount spoiled
  reason: string;
  transactionDate?: Date | string;
}

/**
 * Records stock spoilage for a SPECIFIC batch and updates its quantity.
 * Uses Prisma transaction for atomicity.
 */
export async function recordSpoilage(
  input: RecordSpoilageInput
): Promise<ActionResponse<{ stock: Stock; transaction: StockTransaction }>> {
  // TODO: Implement proper authorization check
  // if (!(await checkUserAuthorization(input.userId, input.organizationId))) {
  //   return { success: false, error: "Unauthorized" };
  // }
  try {
    const quantitySpoiledDecimal = new Prisma.Decimal(input.quantitySpoiled);
    if (quantitySpoiledDecimal.lte(0)) {
      return {
        success: false,
        error: "Quantity spoiled must be a positive value.",
      };
    }

    // Quantity change for the transaction is negative
    const quantityChange = quantitySpoiledDecimal.negated();

    // Delegate to the adjustment function with the correct type
    const adjustmentResult = await recordStockAdjustment({
      organizationId: input.organizationId,
      userId: input.userId,
      stockId: input.stockId,
      quantityChange: quantityChange, // Pass the negative value
      reason: `Spoilage: ${input.reason}`, // Prepend context
      transactionDate: input.transactionDate,
    });

    if (!adjustmentResult.success || !adjustmentResult.data) {
      // Propagate the error from the adjustment function
      return {
        success: false,
        error:
          adjustmentResult.error ??
          "Failed to process spoilage via adjustment.",
      };
    }

    // If adjustment was successful, update the transaction type to SPOILAGE
    const updatedTransaction = await prisma.stockTransaction.update({
      where: { id: adjustmentResult.data.transaction.id },
      data: { type: StockTransactionType.SPOILAGE },
    });

    return {
      success: true,
      data: {
        stock: adjustmentResult.data.stock,
        transaction: updatedTransaction,
      },
    };
  } catch (error: any) {
    console.error("Error recording spoilage:", error);
    return {
      success: false,
      error: error.message || "Failed to record spoilage.",
    };
  }
}

interface RecordReturnInput {
  organizationId: string;
  userId: string;
  productId: string; // Which product is being returned
  quantityReturned: string | number | Prisma.Decimal; // Positive value
  reason: string;
  relatedOrderId?: string; // Optional link to original sale
  transactionDate?: Date | string;
  // Option 1: Add to existing batch
  targetStockId?: string;
  // Option 2: Create a new batch for the return (requires cost info)
  createAsNewBatch?: boolean;
  buyingPriceForNewBatch?: string | number | Prisma.Decimal; // Required if createAsNewBatch=true
  unitForNewBatch?: string; // Required if createAsNewBatch=true
}

/**
 * Records a customer return. This is complex due to deciding where the stock goes.
 * Option 1: Adds quantity to an existing specified batch (targetStockId).
 * Option 2: Creates a new stock batch for the returned items (createAsNewBatch=true).
 * Uses Prisma transaction for atomicity.
 */
export async function recordStockReturn(
  input: RecordReturnInput
): Promise<ActionResponse<{ stock?: Stock; transaction: StockTransaction }>> {
  // TODO: Implement proper authorization check
  // if (!(await checkUserAuthorization(input.userId, input.organizationId))) {
  //   return { success: false, error: "Unauthorized" };
  // }

  try {
    const quantityReturnedDecimal = new Prisma.Decimal(input.quantityReturned);
    if (quantityReturnedDecimal.lte(0)) {
      return { success: false, error: "Quantity returned must be positive." };
    }

    // Validate targetStockId XOR createAsNewBatch is specified
    if (input.targetStockId && input.createAsNewBatch) {
      return {
        success: false,
        error:
          "Specify either 'targetStockId' OR 'createAsNewBatch', not both.",
      };
    }
    if (!input.targetStockId && !input.createAsNewBatch) {
      return {
        success: false,
        error:
          "Must specify either 'targetStockId' to add to, or 'createAsNewBatch=true' for returns.",
      };
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: input.productId, organizationId: input.organizationId },
    });
    if (!product) {
      return {
        success: false,
        error: `Product with ID ${input.productId} not found.`,
      };
    }

    let updatedStock: Stock | undefined = undefined;
    let returnedStockId: string | undefined = input.targetStockId; // Will be set if new batch created

    const transactionResult = await prisma.$transaction(async (tx) => {
      if (input.targetStockId) {
        // --- Option 1: Add to existing batch ---
        const stockToUpdate = await tx.stock.findUnique({
          where: {
            id: input.targetStockId,
            organizationId: input.organizationId,
            productId: input.productId,
          },
        });
        if (!stockToUpdate) {
          throw new Error(
            `Target stock batch ${input.targetStockId} not found or doesn't match product ${input.productId}.`
          );
        }
        updatedStock = await tx.stock.update({
          where: { id: input.targetStockId },
          data: {
            quantityAvailable: { increment: quantityReturnedDecimal },
          },
        });
      } else if (input.createAsNewBatch) {
        // --- Option 2: Create new batch ---
        if (
          input.buyingPriceForNewBatch === undefined ||
          input.unitForNewBatch === undefined
        ) {
          throw new Error(
            "`buyingPriceForNewBatch` and `unitForNewBatch` are required when `createAsNewBatch` is true."
          );
        }
        const buyingPriceDecimal = new Prisma.Decimal(input.buyingPriceForNewBatch);
        if (buyingPriceDecimal.lt(0)) {
          throw new Error("Buying price for new batch cannot be negative.");
        }
        // Optional: Validate unitForNewBatch matches product.unit
        if (input.unitForNewBatch !== product.unit) {
          console.warn(
            `Return batch unit '${input.unitForNewBatch}' differs from product unit '${product.unit}' for product ${input.productId}`
          );
        }

        updatedStock = await tx.stock.create({
          data: {
            organizationId: input.organizationId,
            productId: input.productId,
            quantityAvailable: quantityReturnedDecimal,
            buyingPricePerUnit: buyingPriceDecimal,
            unit: input.unitForNewBatch,
            batchNumber: `RETURN-${input.relatedOrderId ?? Date.now()}`, // Example batch number
            purchaseDate: new Date(), // Treat return date as purchase date
            notes: `Customer return. Original Order: ${input.relatedOrderId ?? "N/A"}. Reason: ${input.reason}`,
            // expiryDate: null, // Usually returns don't have expiry unless reassessed
          },
        });
        returnedStockId = updatedStock.id; // Set the ID for the transaction
      }

      // Create the RETURN transaction, linking to the affected/created stock batch
      const transaction = await tx.stockTransaction.create({
        data: {
          organizationId: input.organizationId,
          productId: input.productId,
          stockId: returnedStockId, // Link to the specific batch affected/created
          type: StockTransactionType.RETURN,
          quantityChange: quantityReturnedDecimal, // Positive for return
          reason: input.reason,
          relatedOrderId: input.relatedOrderId,
          createdById: input.userId,
          transactionDate: input.transactionDate
            ? new Date(input.transactionDate)
            : new Date(),
        },
      });

      return { stock: updatedStock, transaction }; // Return both
    });

    return { success: true, data: transactionResult };
  } catch (error: any) {
    console.error("Error recording stock return:", error);
    return {
      success: false,
      error: error.message || "Failed to record stock return.",
    };
  }
}

interface ListStockTransactionsInput {
  organizationId: string;
  userId: string;
  productId?: string;
  stockId?: string; // Filter by specific batch
  type?: StockTransactionType;
  relatedOrderId?: string;
  createdById?: string; // Filter by user who performed action
  startDate?: Date | string;
  endDate?: Date | string;
  page?: number;
  pageSize?: number;
}

/**
 * Lists stock transactions with optional filtering and pagination.
 */
export async function listStockTransactions(
  input: ListStockTransactionsInput
): Promise<
  ActionResponse<{ transactions: StockTransaction[]; totalCount: number }>
> {
  // TODO: Implement proper authorization check
  // if (!(await checkUserAuthorization(input.userId, input.organizationId))) {
  //   return { success: false, error: "Unauthorized" };
  // }
  try {
    const { organizationId, page = 1, pageSize = 50, ...filters } = input;
    const skip = (page - 1) * pageSize;

    const where: Prisma.StockTransactionWhereInput = {
      organizationId: organizationId,
    };
    if (filters.productId) where.productId = filters.productId;
    if (filters.stockId) where.stockId = filters.stockId;
    if (filters.type) where.type = filters.type;
    if (filters.relatedOrderId) where.relatedOrderId = filters.relatedOrderId;
    if (filters.createdById) where.createdById = filters.createdById;
    if (filters.startDate || filters.endDate) {
      where.transactionDate = {};
      if (filters.startDate)
        where.transactionDate.gte = new Date(filters.startDate);
      if (filters.endDate)
        where.transactionDate.lte = new Date(filters.endDate);
    }

    const [transactions, totalCount] = await prisma.$transaction([
      prisma.stockTransaction.findMany({
        where,
        include: {
          product: { select: { name: true } }, // Include product name
          stock: { select: { batchNumber: true } }, // Include batch number if available
          createdBy: { select: { name: true, email: true } }, // Include user details
          relatedOrder: { select: { orderNumber: true } }, // Include order number
        },
        orderBy: { transactionDate: "desc" },
        skip: skip,
        take: pageSize,
      }),
      prisma.stockTransaction.count({ where }),
    ]);

    return { success: true, data: { transactions, totalCount } };
  } catch (error) {
    console.error("Error listing stock transactions:", error);
    return { success: false, error: "Failed to list stock transactions." };
  }
}

// --- Creative / Advanced Actions ---

interface ProcessSaleStockUpdateInput {
  organizationId: string;
  userId: string; // User processing the sale
  orderId: string; // The order being fulfilled
  items: { productId: string; quantity: string | number | Prisma.Decimal }[];
  // Strategy for picking stock: 'FIFO' (purchaseDate), 'LIFO' (purchaseDate), 'FEFO' (expiryDate)
  deductionStrategy?: "FIFO" | "LIFO" | "FEFO";
}

/**
 * Updates stock levels based on items sold in an order.
 * Finds appropriate stock batches based on the chosen strategy (default FIFO)
 * and creates SALE transactions for each deduction.
 * Uses Prisma transaction for atomicity.
 * IMPORTANT: This should typically be called AFTER an order is confirmed/paid.
 */
export async function processSaleStockUpdate(
  input: ProcessSaleStockUpdateInput
): Promise<ActionResponse<{ transactions: StockTransaction[] }>> {
  // TODO: Implement proper authorization check
  // if (!(await checkUserAuthorization(input.userId, input.organizationId))) {
  //   return { success: false, error: "Unauthorized" };
  // }

  const {
    organizationId,
    userId,
    orderId,
    items,
    deductionStrategy = "FIFO",
  } = input;

  try {
    // Validate order exists and is in a state ready for stock deduction (e.g., PAID, PROCESSING)
    const order = await prisma.order.findUnique({
      where: { id: orderId, organizationId: organizationId },
      select: { status: true },
    });
    if (!order) {
      return { success: false, error: `Order ${orderId} not found.` };
    }
    // Add checks for appropriate order status if needed
    // if (![OrderStatus.PAID, OrderStatus.PROCESSING].includes(order.status)) {
    //    return { success: false, error: `Order ${orderId} is not in a status ready for stock deduction (current: ${order.status}).` };
    // }

    const createdTransactions: StockTransaction[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const productId = item.productId;
        let quantityToDeduct = new Prisma.Decimal(item.quantity);

        if (quantityToDeduct.lte(0)) continue; // Skip zero/negative quantity items

        // Determine sorting based on strategy
        let orderBy: Prisma.StockOrderByWithRelationInput;
        if (deductionStrategy === "FEFO") {
          // Prioritize non-null expiry dates first, then oldest purchase date for nulls
          orderBy = [
            { expiryDate: "asc" /* nulls last by default */ },
            { purchaseDate: "asc" },
          ];
        } else if (deductionStrategy === "LIFO") {
          orderBy = { purchaseDate: "desc" };
        } else {
          // FIFO (default)
          orderBy = { purchaseDate: "asc" };
        }

        // Find available stock batches for the product, ordered by strategy
        const availableBatches = await tx.stock.findMany({
          where: {
            organizationId: organizationId,
            productId: productId,
            quantityAvailable: { gt: 0 },
          },
          orderBy: orderBy,
        });

        let deductedAmount = new Prisma.Decimal(0);

        // Iterate through batches and deduct quantity
        for (const batch of availableBatches) {
          if (quantityToDeduct.lte(0)) break; // Fully deducted for this item

          const quantityFromThisBatch = Prisma.Decimal.min(
            quantityToDeduct,
            batch.quantityAvailable
          );

          // Update the stock batch quantity
          await tx.stock.update({
            where: { id: batch.id },
            data: {
              quantityAvailable: { decrement: quantityFromThisBatch },
            },
          });

          // Create the SALE transaction record
          const transaction = await tx.stockTransaction.create({
            data: {
              organizationId: organizationId,
              productId: productId,
              stockId: batch.id, // Link to the specific batch
              type: StockTransactionType.SALE,
              quantityChange: quantityFromThisBatch.negated(), // Negative for sale
              relatedOrderId: orderId,
              createdById: userId,
              transactionDate: new Date(),
              reason: `Order ${orderId} fulfillment`,
            },
          });
          createdTransactions.push(transaction);

          quantityToDeduct = quantityToDeduct.sub(quantityFromThisBatch);
          deductedAmount = deductedAmount.add(quantityFromThisBatch);
        }

        // Check if the full quantity could be deducted
        if (quantityToDeduct.gt(0)) {
          // Insufficient stock! Rollback the transaction.
          const productInfo = await tx.product.findUnique({
            where: { id: productId },
            select: { name: true, sku: true },
          });
          throw new Error(
            `Insufficient stock for product ${productInfo?.name ?? productId} (SKU: ${productInfo?.sku ?? "N/A"}). Required: ${item.quantity}, Available: ${deductedAmount}.`
          );
        }
      } // End loop through items
    }); // End transaction

    return { success: true, data: { transactions: createdTransactions } };
  } catch (error: any) {
    console.error("Error processing sale stock update:", error);
    return {
      success: false,
      error: error.message || "Failed to process sale stock update.",
    };
  }
}

interface ReconcileStockCountInput {
  organizationId: string;
  userId: string; // User performing the count/reconciliation
  // Array of actual physical counts per stock batch
  counts: { stockId: string; actualQuantity: string | number | Prisma.Decimal }[];
  reconciliationReason: string; // e.g., "Annual Stocktake", "Cycle Count Area A"
  transactionDate?: Date | string;
}

/**
 * Reconciles physical stock counts against recorded quantities for specific batches.
 * Creates ADJUSTMENT transactions for any discrepancies found.
 * Uses Prisma transaction for atomicity across all counts.
 */
export async function reconcileStockCount(
  input: ReconcileStockCountInput
): Promise<ActionResponse<{ adjustments: StockTransaction[] }>> {
  // TODO: Implement proper authorization check
  // if (!(await checkUserAuthorization(input.userId, input.organizationId))) {
  //   return { success: false, error: "Unauthorized" };
  // }

  const {
    organizationId,
    userId,
    counts,
    reconciliationReason,
    transactionDate,
  } = input;
  const createdAdjustments: StockTransaction[] = [];

  try {
    if (!counts || counts.length === 0) {
      return {
        success: false,
        error: "No stock counts provided for reconciliation.",
      };
    }

    await prisma.$transaction(async (tx) => {
      for (const count of counts) {
        const stockId = count.stockId;
        const actualQuantity = new Prisma.Decimal(count.actualQuantity);

        if (actualQuantity.lt(0)) {
          throw new Error(
            `Actual quantity cannot be negative for stock batch ${stockId}.`
          );
        }

        // Get the current recorded quantity for the batch
        const stock = await tx.stock.findUnique({
          where: { id: stockId, organizationId: organizationId },
          select: { id: true, productId: true, quantityAvailable: true },
        });

        if (!stock) {
          // Log warning or throw error depending on strictness
          console.warn(
            `Stock batch ${stockId} provided in reconciliation count not found in organization ${organizationId}. Skipping.`
          );
          continue; // Skip this count
          // OR: throw new Error(`Stock batch ${stockId} not found.`);
        }

        const recordedQuantity = stock.quantityAvailable;
        const discrepancy = actualQuantity.sub(recordedQuantity); // positive = increase, negative = decrease

        // Only create adjustment if there is a discrepancy
        if (!discrepancy.isZero()) {
          // Update the stock batch quantity to the actual count
          await tx.stock.update({
            where: { id: stockId },
            data: { quantityAvailable: actualQuantity },
          });

          // Create the ADJUSTMENT transaction
          const adjustment = await tx.stockTransaction.create({
            data: {
              organizationId: organizationId,
              productId: stock.productId,
              stockId: stockId,
              type: StockTransactionType.ADJUSTMENT,
              quantityChange: discrepancy, // The difference found
              reason: reconciliationReason,
              createdById: userId,
              transactionDate: transactionDate
                ? new Date(transactionDate)
                : new Date(),
            },
          });
          createdAdjustments.push(adjustment);
        }
      } // End loop through counts
    }); // End transaction

    return { success: true, data: { adjustments: createdAdjustments } };
  } catch (error: any) {
    console.error("Error during stock count reconciliation:", error);
    return {
      success: false,
      error: error.message || "Failed to reconcile stock count.",
    };
  }
}

interface TransferStockInput {
  organizationId: string;
  userId: string;
  sourceStockId: string;
  quantity: string | number | Prisma.Decimal;
  reason: string;
  transactionDate?: Date | string;
  // Option 1: Transfer to another existing batch of the SAME product
  targetStockId?: string;
  // Option 2: Create a new batch for the transferred stock (SAME product)
  // If creating new, use source batch details or allow overrides? Let's use source details for simplicity.
  createAsNewBatch?: boolean;
}

/**
 * Transfers a quantity of stock from one batch to another (or a new batch)
 * for the SAME product within the organization.
 * Creates TRANSFER_OUT and TRANSFER_IN transactions.
 * Uses Prisma transaction for atomicity.
 */
export async function transferStock(
  input: TransferStockInput
): Promise<
  ActionResponse<{
    outTransaction: StockTransaction;
    inTransaction: StockTransaction;
  }>
> {
  // TODO: Implement proper authorization check
  // if (!(await checkUserAuthorization(input.userId, input.organizationId))) {
  //   return { success: false, error: "Unauthorized" };
  // }

  const {
    organizationId,
    userId,
    sourceStockId,
    quantity,
    reason,
    transactionDate,
    targetStockId,
    createAsNewBatch,
  } = input;

  try {
    const quantityToTransfer = new Prisma.Decimal(quantity);
    if (quantityToTransfer.lte(0)) {
      return {
        success: false,
        error: "Quantity to transfer must be positive.",
      };
    }
    if (targetStockId && createAsNewBatch) {
      return {
        success: false,
        error:
          "Specify either 'targetStockId' OR 'createAsNewBatch', not both.",
      };
    }
    if (!targetStockId && !createAsNewBatch) {
      return {
        success: false,
        error:
          "Must specify either 'targetStockId' or 'createAsNewBatch=true' for the transfer destination.",
      };
    }
    if (targetStockId === sourceStockId) {
      return {
        success: false,
        error: "Source and target stock batch cannot be the same.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get source stock batch and validate quantity
      const sourceStock = await tx.stock.findUnique({
        where: { id: sourceStockId, organizationId: organizationId },
      });
      if (!sourceStock) {
        throw new Error(`Source stock batch ${sourceStockId} not found.`);
      }
      if (sourceStock.quantityAvailable.lt(quantityToTransfer)) {
        throw new Error(
          `Insufficient quantity (${sourceStock.quantityAvailable}) in source batch ${sourceStockId} to transfer ${quantityToTransfer}.`
        );
      }

      let finalTargetStockId: string;
      const targetProductId: string = sourceStock.productId; // Product must be the same

      // 2. Handle target (existing or new)
      if (targetStockId) {
        // Validate target exists and is for the same product
        const targetStock = await tx.stock.findUnique({
          where: { id: targetStockId, organizationId: organizationId },
          select: { id: true, productId: true },
        });
        if (!targetStock) {
          throw new Error(`Target stock batch ${targetStockId} not found.`);
        }
        if (targetStock.productId !== sourceStock.productId) {
          throw new Error(
            `Product mismatch: Source (${sourceStock.productId}) and Target (${targetStock.productId}) must be the same product.`
          );
        }
        finalTargetStockId = targetStock.id;
        // Increment target quantity
        await tx.stock.update({
          where: { id: finalTargetStockId },
          data: { quantityAvailable: { increment: quantityToTransfer } },
        });
      } else {
        // createAsNewBatch = true
        // Create a new stock batch based on the source, but with the transferred quantity
        const newTargetStock = await tx.stock.create({
          data: {
            organizationId: organizationId,
            productId: sourceStock.productId,
            quantityAvailable: quantityToTransfer,
            unit: sourceStock.unit, // Copy details from source
            buyingPricePerUnit: sourceStock.buyingPricePerUnit, // Crucial: Keep the cost basis
            batchNumber: `${sourceStock.batchNumber ?? sourceStock.id}-TFR`, // Indicate transfer origin
            purchaseDate: sourceStock.purchaseDate, // Keep original dates if relevant
            expiryDate: sourceStock.expiryDate,
            notes: `Transferred from batch ${sourceStock.id}. Reason: ${reason}`,
            supplierId: sourceStock.supplierId, // Keep supplier link if exists
          },
        });
        finalTargetStockId = newTargetStock.id;
      }

      // 3. Decrement source quantity
      await tx.stock.update({
        where: { id: sourceStockId },
        data: { quantityAvailable: { decrement: quantityToTransfer } },
      });

      // 4. Create TRANSFER_OUT transaction for source
      const outTx = await tx.stockTransaction.create({
        data: {
          organizationId: organizationId,
          productId: sourceStock.productId,
          stockId: sourceStockId,
          type: StockTransactionType.TRANSFER_OUT,
          quantityChange: quantityToTransfer.negated(), // Negative change
          reason: `Transfer TO batch ${finalTargetStockId}. ${reason}`,
          createdById: userId,
          transactionDate: transactionDate
            ? new Date(transactionDate)
            : new Date(),
          // Consider linking related transactions if needed, e.g., adding a custom field `relatedTransferTransactionId`
        },
      });

      // 5. Create TRANSFER_IN transaction for target
      const inTx = await tx.stockTransaction.create({
        data: {
          organizationId: organizationId,
          productId: targetProductId, // Same product
          stockId: finalTargetStockId,
          type: StockTransactionType.TRANSFER_IN,
          quantityChange: quantityToTransfer, // Positive change
          reason: `Transfer FROM batch ${sourceStockId}. ${reason}`,
          createdById: userId,
          transactionDate: transactionDate
            ? new Date(transactionDate)
            : new Date(),
          // Link back: `relatedTransferTransactionId: outTx.id`
        },
      });

      return { outTransaction: outTx, inTransaction: inTx };
    }); // End transaction

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error transferring stock:", error);
    return {
      success: false,
      error: error.message || "Failed to transfer stock.",
    };
  }
}
