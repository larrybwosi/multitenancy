// // src/actions/productActions.ts
// "use server";

// import { auth } from "@/lib/auth";
// import {
//   Prisma,
//   Product,
//   ProductType,
//   StockTransactionType,
// } from "@prisma/client";
// import { Decimal } from "@prisma/client/runtime/library";
// import { headers } from "next/headers";
// import { db as prisma } from "@/lib/db";

// // --- Shared Helpers (Assume these are defined elsewhere or define here) ---
// interface ActionResponse<T> {
//   success: boolean;
//   data?: T;
//   error?: string;
//   validationErrors?: Record<string, string>;
// }

// // Replace with your actual authorization logic
// async function checkUserAuthorization(
//   role: string,
//   organizationId: string
// ): Promise<boolean> {
//   console.log(role, organizationId)
//   // Example: Check if user is a member of the organization
//   // const member = await prisma.member.findUnique({ where: { userId_organizationId: { userId, organizationId } } });
//   // return !!member; // Add role checks if needed
//   return true; // Placeholder - REMOVE IN PRODUCTION
// }

// // --- Input Types ---

// interface CreateProductInput {
//   name: string;
//   description?: string;
//   sku?: string;
//   type?: ProductType; // Default defined in schema
//   unit: string;
//   currentSellingPrice: string | number | Decimal;
//   categoryId?: string;
//   isActive?: boolean; // Default defined in schema
// }

// interface UpdateProductInput {
//   organizationId: string;
//   productId: string;
//   userId: string; // For authorization
//   name?: string;
//   description?: string | null;
//   sku?: string | null;
//   type?: ProductType;
//   unit?: string;
//   currentSellingPrice?: string | number | Decimal;
//   categoryId?: string | null;
//   isActive?: boolean;
// }

// interface ListProductsInput {
//   categoryId?: string;
//   isActive?: boolean;
//   searchTerm?: string; // Search by name, SKU, description
//   sortBy?: "name" | "createdAt" | "updatedAt" | "currentSellingPrice";
//   sortOrder?: "asc" | "desc";
//   page?: number;
//   pageSize?: number;
//   includeCategory?: boolean;
// }

// // --- Output Types ---

// // Interface for the detailed product view
// export interface ProductDetails extends Product {
//   categoryName?: string | null; // Name from the related category
//   currentStockQuantity: Decimal;
//   currentStockValue: Decimal; // Estimated value based on buying price
//   potentialProfitOnCurrentStock: Decimal; // Based on current selling price
//   totalUnitsSold: Decimal;
//   totalRevenueGenerated: Decimal;
//   estimatedTotalProfitGenerated: Decimal; // Revenue - Estimated COGS
//   averageBuyingPrice: Decimal; // Weighted average based on current stock
//   lastOrderDate: Date | null;
//   numberOfStockBatches: number; // Number of distinct batches with quantity > 0
//   // Add more fields as needed
// }

// // --- Basic CRUD Actions ---

// /**
//  * Creates a new product within an organization.
//  */
// export async function createProduct(
//   input: CreateProductInput
// ): Promise<ActionResponse<Product>> {

  
//   const session = await auth.api.getSession({ headers: await headers() });
//   const organizationId = session?.session.activeOrganizationId;
//   const userId = session?.session.userId
//   if (!userId || !organizationId) throw new Error("Unauthorized");

//   if (!(await checkUserAuthorization(userId, organizationId))) {
//     return { success: false, error: "Unauthorized" };
//   }

//   try {
//     const sellingPriceDecimal = new Decimal(input.currentSellingPrice);
//     if (sellingPriceDecimal.lt(0)) {
//       return { success: false, error: "Selling price cannot be negative." };
//     }

//     // Validate category if provided
//     if (input.categoryId) {
//       const category = await prisma.category.findUnique({
//         where: { id: input.categoryId, organizationId },
//       });
//       if (!category) {
//         return {
//           success: false,
//           error: `Category with ID ${input.categoryId} not found in this organization.`,
//         };
//       }
//     }

//     // Validate SKU uniqueness within the organization if provided
//     if (input.sku) {
//       const existingSku = await prisma.product.findUnique({
//         where: {
//           organizationId_sku: {
//             organizationId,
//             sku: input.sku,
//           },
//         },
//       });
//       if (existingSku) {
//         return {
//           success: false,
//           error: `SKU '${input.sku}' already exists in this organization.`,
//         };
//       }
//     }

//     const newProduct = await prisma.product.create({
//       data: {
//         organizationId,
//         name: input.name,
//         description: input.description,
//         sku: input.sku,
//         type: input.type, // Uses schema default if undefined
//         unit: input.unit,
//         currentSellingPrice: sellingPriceDecimal,
//         categoryId: input.categoryId,
//         isActive: input.isActive, // Uses schema default if undefined
//       },
//     });

//     return { success: true, data: newProduct };
//   } catch (error) {
//     console.error("Error creating product:", error);
//     if (
//       error instanceof Prisma.PrismaClientKnownRequestError &&
//       error.code === "P2002"
//     ) {
//       // Handle potential race condition on unique constraints if validation above missed it
//       return {
//         success: false,
//         error: `A product with conflicting unique field (e.g., SKU) already exists.`,
//       };
//     }
//     return { success: false, error: "Failed to create product." };
//   }
// }

// /**
//  * Retrieves a single product by its ID.
//  */
// export async function getProduct(
//   organizationId: string,
//   productId: string,
//   userId: string
// ): Promise<ActionResponse<Product>> {
//   if (!(await checkUserAuthorization(userId, organizationId))) {
//     return { success: false, error: "Unauthorized" };
//   }
//   try {
//     const product = await prisma.product.findUnique({
//       where: { id: productId, organizationId },
//       include: { category: { select: { name: true } } }, // Include category name
//     });

//     if (!product) {
//       return { success: false, error: "Product not found." };
//     }
//     return { success: true, data: product };
//   } catch (error) {
//     console.error("Error getting product:", error);
//     return { success: false, error: "Failed to retrieve product." };
//   }
// }

// /**
//  * Updates an existing product.
//  */
// export async function updateProduct(
//   input: UpdateProductInput
// ): Promise<ActionResponse<Product>> {
//   if (!(await checkUserAuthorization(input.userId, input.organizationId))) {
//     return { success: false, error: "Unauthorized" };
//   }

//   try {
//     // Ensure product exists in the org
//     const existingProduct = await prisma.product.findUnique({
//       where: { id: input.productId, organizationId: input.organizationId },
//     });
//     if (!existingProduct) {
//       return { success: false, error: "Product not found." };
//     }

//     // Prepare update data
//     const updateData: Prisma.ProductUpdateInput = {};
//     if (input.name !== undefined) updateData.name = input.name;
//     if (input.description !== undefined)
//       updateData.description = input.description;
//     if (input.sku !== undefined) {
//       // Validate SKU uniqueness if changing SKU
//       if (input.sku && input.sku !== existingProduct.sku) {
//         const existingSku = await prisma.product.findUnique({
//           where: {
//             organizationId_sku: {
//               organizationId: input.organizationId,
//               sku: input.sku,
//             },
//           },
//         });
//         if (existingSku) {
//           return {
//             success: false,
//             error: `SKU '${input.sku}' already exists in this organization.`,
//           };
//         }
//       }
//       updateData.sku = input.sku;
//     }
//     if (input.type !== undefined) updateData.type = input.type;
//     if (input.unit !== undefined) updateData.unit = input.unit;
//     if (input.currentSellingPrice !== undefined) {
//       const sellingPriceDecimal = new Decimal(input.currentSellingPrice);
//       if (sellingPriceDecimal.lt(0)) {
//         return { success: false, error: "Selling price cannot be negative." };
//       }
//       updateData.currentSellingPrice = sellingPriceDecimal;
//     }
//     if (input.categoryId !== undefined) {
//       // If setting a category, validate it exists; null clears it
//       if (input.categoryId) {
//         const category = await prisma.category.findUnique({
//           where: { id: input.categoryId, organizationId: input.organizationId },
//         });
//         if (!category) {
//           return {
//             success: false,
//             error: `Category with ID ${input.categoryId} not found.`,
//           };
//         }
//         updateData.category = { connect: { id: input.categoryId } };
//       } else {
//         updateData.category = { disconnect: true };
//       }
//     }
//     if (input.isActive !== undefined) updateData.isActive = input.isActive;

//     if (Object.keys(updateData).length === 0) {
//       return { success: false, error: "No fields provided for update." };
//     }

//     const updatedProduct = await prisma.product.update({
//       where: { id: input.productId },
//       data: updateData,
//     });

//     return { success: true, data: updatedProduct };
//   } catch (error) {
//     console.error("Error updating product:", error);
//     if (
//       error instanceof Prisma.PrismaClientKnownRequestError &&
//       error.code === "P2002"
//     ) {
//       return {
//         success: false,
//         error: `A product with conflicting unique field (e.g., SKU) already exists.`,
//       };
//     }
//     return { success: false, error: "Failed to update product." };
//   }
// }

// /**
//  * Toggles the active status of a product (safer than deleting).
//  */
// export async function toggleProductActiveStatus(
//   productId: string,
//   isActive: boolean
// ): Promise<ActionResponse<Product>> {

//   const session = await auth.api.getSession({ headers: await headers() });
//   const organizationId = session?.session.activeOrganizationId;
//   const userId = session?.session.userId;
//   if (!userId || !organizationId) throw new Error("Unauthorized");

//     if (!(await checkUserAuthorization(userId, organizationId))) {
//     return { success: false, error: "Unauthorized" };
//   }
  
//   try {
//     const updatedProduct = await prisma.product.update({
//       where: { id: productId, organizationId },
//       data: { isActive: isActive },
//     });
//     if (!updatedProduct) {
//       return { success: false, error: "Product not found." };
//     }
//     return { success: true, data: updatedProduct };
//   } catch (error) {
//     console.error("Error toggling product status:", error);
//     return { success: false, error: "Failed to toggle product status." };
//   }
// }

// /**
//  * Deletes a product. WARNING: This can fail or cause data loss if the product
//  * has associated Stock, OrderItems, or StockTransactions due to restrictive relations.
//  * Consider using toggleProductActiveStatus instead.
//  */
// export async function deleteProduct(
//   organizationId: string,
//   productId: string,
// ): Promise<ActionResponse<{ id: string }>> {

//   const session = await auth.api.getSession({ headers: await headers() });
//   if (!session?.user.id) throw new Error("Unauthorized");
//   console.log(session?.session.activeOrganizationId);
//   if (!(await checkUserAuthorization(session?.user.id, organizationId))) {
//     return { success: false, error: "Unauthorized" };
//   }

//   try {
//     // --- Check for Dependencies ---
//     // It's often better to prevent deletion if dependencies exist.
//     const dependencies = await prisma.$transaction([
//       prisma.stock.count({ where: { productId: productId } }),
//       prisma.orderItem.count({ where: { productId: productId } }),
//       prisma.stockTransaction.count({ where: { productId: productId } }),
//     ]);

//     const [stockCount, orderItemCount, transactionCount] = dependencies;

//     if (stockCount > 0 || orderItemCount > 0 || transactionCount > 0) {
//       const errors: string[] = [];
//       if (stockCount > 0) errors.push(`${stockCount} stock batch(es)`);
//       if (orderItemCount > 0) errors.push(`${orderItemCount} order item(s)`);
//       if (transactionCount > 0)
//         errors.push(`${transactionCount} stock transaction(s)`);
//       return {
//         success: false,
//         error: `Cannot delete product: Found associated ${errors.join(", ")}. Consider deactivating the product instead.`,
//       };
//     }
//     // --- End Dependency Check ---

//     // If no dependencies, proceed with deletion
//     const deletedProduct = await prisma.product.delete({
//       where: { id: productId, organizationId: organizationId }, // Ensure it belongs to the org
//     });

//     return { success: true, data: { id: deletedProduct.id } };
//   } catch (error) {
//     console.error("Error deleting product:", error);
//     if (error instanceof Prisma.PrismaClientKnownRequestError) {
//       if (error.code === "P2025") {
//         // Record to delete not found
//         return { success: false, error: "Product not found." };
//       }
//       if (error.code === "P2003" || error.code === "P2014") {
//         // Foreign key constraint violation (should be caught by check above, but as fallback)
//         return {
//           success: false,
//           error:
//             "Cannot delete product due to existing related records (e.g., orders, stock). Consider deactivating instead.",
//         };
//       }
//     }
//     return { success: false, error: "Failed to delete product." };
//   }
// }

// /**
//  * Lists products with filtering, sorting, and pagination.
//  */
// export async function listProducts(
//   input: ListProductsInput
// ): Promise<
//   ActionResponse<{
//     products: (Product & {
//       category?: { name: string | null };
//       _sum?: { stockQuantity: Decimal | null };
//     })[];
//     totalCount: number;
//   }>
// > {
//   const organizationId =''
//   try {
//     const {
//       page = 1,
//       pageSize = 20,
//       sortBy = "name",
//       sortOrder = "asc",
//       searchTerm,
//       includeCategory = false,
//       ...filters
//     } = input;
//     const skip = (page - 1) * pageSize;

//     const where: Prisma.ProductWhereInput = {
//       organizationId: organizationId,
//     };
//     if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
//     if (filters.isActive !== undefined) where.isActive = filters.isActive;
//     if (searchTerm) {
//       where.OR = [
//         { name: { contains: searchTerm, mode: "insensitive" } },
//         { description: { contains: searchTerm, mode: "insensitive" } },
//         { sku: { contains: searchTerm, mode: "insensitive" } },
//       ];
//     }

//     const orderBy: Prisma.ProductOrderByWithRelationInput = {
//       [sortBy]: sortOrder,
//     };

//     // Prepare includes selectively
//     const include: Prisma.ProductInclude = {};
//     if (includeCategory) {
//       include.category = { select: { name: true } };
//     }
//     let productsData: any[] = [];
//     let totalCount = 0;

//       // Fetch without stock sums
//       [productsData, totalCount] = await prisma.$transaction([
//         prisma.product.findMany({
//           where,
//           include,
//           orderBy,
//           skip,
//           take: pageSize,
//         }),
//         prisma.product.count({ where }),
//       ]);

//     return { success: true, data: { products: productsData, totalCount } };
//   } catch (error) {
//     console.error("Error listing products:", error);
//     return { success: false, error: "Failed to list products." };
//   }
// }

// // --- Complex Read Actions ---

// /**
//  * Retrieves detailed information and calculated metrics for a single product.
//  * Note: This function performs multiple database queries and calculations,
//  * which might impact performance. Use judiciously.
//  */
// export async function getProductDetails(
//   organizationId: string,
//   productId: string,
// ): Promise<ActionResponse<ProductDetails>> {
//   try {
//     // 1. Fetch base product data
//     const product = await prisma.product.findUnique({
//       where: { id: productId, organizationId: organizationId },
//       include: { category: { select: { name: true } } },
//     });

//     if (!product) {
//       return { success: false, error: "Product not found." };
//     }

//     // 2. Fetch current stock batches for calculations
//     const currentStockBatches = await prisma.stock.findMany({
//       where: {
//         productId: productId,
//         organizationId: organizationId,
//         quantityAvailable: { gt: 0 }, // Only batches with stock
//       },
//     });

//     // 3. Calculate stock metrics
//     let currentStockQuantity = new Decimal(0);
//     let currentStockValue = new Decimal(0);
//     let numberOfStockBatches = 0;

//     currentStockBatches.forEach((batch) => {
//       currentStockQuantity = currentStockQuantity.add(batch.quantityAvailable);
//       currentStockValue = currentStockValue.add(
//         batch.quantityAvailable.mul(batch.buyingPricePerUnit)
//       );
//       numberOfStockBatches++;
//     });

//     const averageBuyingPrice = currentStockQuantity.gt(0)
//       ? currentStockValue.div(currentStockQuantity)
//       : new Decimal(0);

//     const potentialProfitOnCurrentStock = currentStockBatches.reduce(
//       (sum, batch) => {
//         const profitPerUnit = product.currentSellingPrice.sub(
//           batch.buyingPricePerUnit
//         );
//         // Only add if selling price is higher than buying price
//         if (profitPerUnit.gt(0)) {
//           return sum.add(batch.quantityAvailable.mul(profitPerUnit));
//         }
//         return sum;
//       },
//       new Decimal(0)
//     );

//     // 4. Calculate sales metrics
//     const salesAggregations = await prisma.stockTransaction.aggregate({
//       _sum: { quantityChange: true },
//       where: {
//         productId: productId,
//         organizationId: organizationId,
//         type: StockTransactionType.SALE,
//       },
//     });
//     const totalUnitsSold =
//       salesAggregations._sum.quantityChange?.abs() ?? new Decimal(0);

//     const revenueAggregations = await prisma.orderItem.aggregate({
//       _sum: { totalPrice: true },
//       where: {
//         productId: productId,
//         order: { organizationId: organizationId }, // Ensure order belongs to the org
//       },
//     });
//     const totalRevenueGenerated =
//       revenueAggregations._sum.totalPrice ?? new Decimal(0);

//     // Estimate COGS using the *average buying price* of *current* stock.
//     // This is an ESTIMATE. True COGS requires tracking cost per sale.
//     const estimatedCOGS = totalUnitsSold.mul(averageBuyingPrice);
//     const estimatedTotalProfitGenerated =
//       totalRevenueGenerated.sub(estimatedCOGS);

//     // 5. Find last order date
//     const lastOrderItem = await prisma.orderItem.findFirst({
//       where: {
//         productId: productId,
//         order: { organizationId: organizationId },
//       },
//       orderBy: { order: { createdAt: "desc" } },
//       select: { order: { select: { createdAt: true } } },
//     });
//     const lastOrderDate = lastOrderItem?.order?.createdAt ?? null;

//     // 6. Assemble the detailed product data
//     const productDetails: ProductDetails = {
//       ...product, // Spread the base product data
//       categoryName: product.category?.name,
//       currentStockQuantity,
//       currentStockValue,
//       potentialProfitOnCurrentStock,
//       totalUnitsSold,
//       totalRevenueGenerated,
//       estimatedTotalProfitGenerated,
//       averageBuyingPrice,
//       lastOrderDate,
//       numberOfStockBatches,
//     };

//     return { success: true, data: productDetails };
//   } catch (error) {
//     console.error("Error getting product details:", error);
//     return { success: false, error: "Failed to retrieve product details." };
//   }
// }

// // --- Other Utility Product Actions ---

// interface FindProductsInput {
//   organizationId: string;
//   userId: string;
// }

// interface FindProductsNearingExpiryInput extends FindProductsInput {
//   daysThreshold: number; // e.g., 30 days from now
// }
// interface ExpiringProductInfo {
//   productId: string;
//   productName: string | null;
//   sku: string | null;
//   expiringBatches: {
//     stockId: string;
//     batchNumber: string | null;
//     quantityAvailable: Decimal;
//     expiryDate: Date;
//   }[];
// }
// /**
//  * Finds products that have stock batches expiring within a specified threshold.
//  */
// export async function findProductsNearingExpiry(
//   input: FindProductsNearingExpiryInput
// ): Promise<ActionResponse<ExpiringProductInfo[]>> {
//   if (!(await checkUserAuthorization(input.userId, input.organizationId))) {
//     return { success: false, error: "Unauthorized" };
//   }
//   try {
//     const { organizationId, daysThreshold } = input;
//     const soonExpiryDate = new Date();
//     soonExpiryDate.setDate(soonExpiryDate.getDate() + daysThreshold);

//     // Find stock batches expiring soon
//     const expiringStock = await prisma.stock.findMany({
//       where: {
//         organizationId: organizationId,
//         expiryDate: {
//           lte: soonExpiryDate,
//           gte: new Date(), // Not already expired
//         },
//         quantityAvailable: { gt: 0 },
//       },
//       include: {
//         product: { select: { id: true, name: true, sku: true } },
//       },
//       orderBy: {
//         productId: "asc", // Group results by product
//         expiryDate: "asc",
//       },
//     });

//     // Group batches by product
//     const productsMap = new Map<string, ExpiringProductInfo>();
//     expiringStock.forEach((stock) => {
//       if (!stock.expiryDate) return; // Should not happen based on query, but safety check

//       let productInfo = productsMap.get(stock.productId);
//       if (!productInfo) {
//         productInfo = {
//           productId: stock.productId,
//           productName: stock.product.name,
//           sku: stock.product.sku,
//           expiringBatches: [],
//         };
//         productsMap.set(stock.productId, productInfo);
//       }
//       productInfo.expiringBatches.push({
//         stockId: stock.id,
//         batchNumber: stock.batchNumber,
//         quantityAvailable: stock.quantityAvailable,
//         expiryDate: stock.expiryDate,
//       });
//     });

//     return { success: true, data: Array.from(productsMap.values()) };
//   } catch (error) {
//     console.error("Error finding products nearing expiry:", error);
//     return { success: false, error: "Failed to find products nearing expiry." };
//   }
// }

// interface FindProductsLowOnStockInput extends FindProductsInput {
//   quantityThreshold: number;
// }
// interface LowStockProductInfo {
//   productId: string;
//   productName: string | null;
//   sku: string | null;
//   totalQuantityAvailable: Decimal;
//   unit: string;
// }
// /**
//  * Finds products where the total available stock across all batches is below a threshold.
//  */
// export async function findProductsLowOnStock(
//   input: FindProductsLowOnStockInput
// ): Promise<ActionResponse<LowStockProductInfo[]>> {
//   if (!(await checkUserAuthorization(input.userId, input.organizationId))) {
//     return { success: false, error: "Unauthorized" };
//   }
//   try {
//     const { organizationId, quantityThreshold } = input;
//     const lowStockThresholdDecimal = new Decimal(quantityThreshold);

//     // Aggregate stock quantities per product
//     const productStockLevels = await prisma.stock.groupBy({
//       by: ["productId"],
//       _sum: { quantityAvailable: true },
//       where: {
//         organizationId: organizationId,
//         quantityAvailable: { gt: 0 }, // Only consider batches with stock
//       },
//       having: {
//         // Filter groups based on the sum
//         quantityAvailable: {
//           _sum: {
//             lte: lowStockThresholdDecimal,
//           },
//         },
//       },
//     });

//     const lowStockProductIds = productStockLevels.map((p) => p.productId);

//     // Fetch details for these products
//     if (lowStockProductIds.length === 0) {
//       return { success: true, data: [] }; // No products low on stock
//     }

//     const lowStockProductsDetails = await prisma.product.findMany({
//       where: {
//         id: { in: lowStockProductIds },
//         organizationId: organizationId, // Ensure correct org
//         isActive: true, // Typically only care about active products
//       },
//       select: { id: true, name: true, sku: true, unit: true },
//     });

//     // Combine product details with aggregated quantities
//     const result = lowStockProductsDetails.map((p) => {
//       const stockLevel = productStockLevels.find(
//         (psl) => psl.productId === p.id
//       );
//       return {
//         productId: p.id,
//         productName: p.name,
//         sku: p.sku,
//         totalQuantityAvailable:
//           stockLevel?._sum?.quantityAvailable ?? new Decimal(0),
//         unit: p.unit,
//       };
//     });

//     return { success: true, data: result };
//   } catch (error) {
//     console.error("Error finding products low on stock:", error);
//     return { success: false, error: "Failed to find products low on stock." };
//   }
// }
