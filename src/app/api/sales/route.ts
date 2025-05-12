import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/db";
import {
  Prisma,
  PaymentMethod,
  PaymentStatus,
  ProductVariant,
  LoyaltyReason,
} from "@/prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// --- Zod Schema for Input Validation ---
const saleItemInputSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional(),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  unitPriceOverride: z
    .number()
    .nonnegative("Unit price override cannot be negative")
    .optional(),
  discountAmount: z
    .number()
    .nonnegative("Item discount amount cannot be negative")
    .optional(), // Item-level discount total for this line
  taxRate: z
    .number()
    .min(0, "Tax rate cannot be negative")
    .max(1, "Tax rate must be between 0 and 1")
    .optional(), // Item-level tax rate (e.g., 0.19 for 19%)
});

const createSaleRequestBodySchema = z.object({
  customerId: z.string().cuid().optional(),
  items: z
    .array(saleItemInputSchema)
    .nonempty("Sale must include at least one item"),
  paymentMethod: z.nativeEnum(PaymentMethod), // Validate against the enum
  discountAmount: z
    .number()
    .nonnegative("Sale discount amount cannot be negative")
    .optional(), // Sale-level discount
  notes: z.string().optional(),
  cashDrawerId: z.string().cuid().optional(),
});

// Type inferred from the Zod schema
type CreateSaleRequestBody = z.infer<typeof createSaleRequestBodySchema>;


async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  if (!userId) {
    console.error("Authentication failed: No user ID found in session.");
    throw new Error("Unauthorized: User not authenticated."); 
  }
  return userId;
}

// --- API Route Handler: POST /api/sales ---
export async function POST(request: NextRequest) {
  let authenticatedUserId: string;
  try {
    // 1. Authentication & Authorization
    authenticatedUserId = await getAuthenticatedUserId();

    // Optional: Add role-based authorization if needed
    // const user = await prisma.user.findUnique({ where: { id: authenticatedUserId } });
    // if (!user || !['ADMIN', 'MANAGER', 'CASHIER'].includes(user.role)) {
    //   return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 });
    // }

    // 2. Parse and Validate Request Body using Zod
    const requestBody = await request.json();
    const validationResult = createSaleRequestBodySchema.safeParse(requestBody);

    if (!validationResult.success) {
      console.error(
        "Sale creation validation failed:",
        validationResult.error.errors
      );
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.flatten().fieldErrors, // Provide detailed errors
        },
        { status: 400 }
      );
    }

    const body: CreateSaleRequestBody = validationResult.data;

    // --- 3. Prisma Transaction ---
    // Wrap all database operations in a transaction for atomicity
    const newSaleResult = await prisma.$transaction(
      async (tx) => {
        let calculatedItemSubTotal = new Prisma.Decimal(0); // Sum of (unitPrice * quantity) across all items BEFORE discounts/taxes
        let calculatedTotalItemDiscount = new Prisma.Decimal(0); // Sum of all item-level discounts
        let calculatedTotalTax = new Prisma.Decimal(0); // Sum of all item-level taxes

        // Prisma type for creating multiple SaleItems linked to a Sale
        const saleItemsToCreate: Prisma.SaleItemCreateManySaleInput[] = [];

        // --- 3a. Process Items, Check & Decrement Stock ---
        for (const itemInput of body.items) {
          // Basic check (already covered by Zod, but good defense in depth)
          if (itemInput.quantity <= 0) continue;

          // Fetch Product/Variant details within the transaction
          const product = await tx.product.findUnique({
            where: { id: itemInput.productId },
            include: {
              // Conditionally include variants only if a variantId is provided
              variants: itemInput.variantId
                ? { where: { id: itemInput.variantId } }
                : false,
            },
          });

          // Validate product existence and status
          if (!product || !product.isActive) {
            throw new Error(
              `Product ID ${itemInput.productId} not found or is inactive.`
            );
          }

          let variant: ProductVariant | null = null;
          let effectiveSku = product.sku;
          const basePrice = product.basePrice;
          let priceModifier = new Prisma.Decimal(0);

          // Handle variant logic
          if (itemInput.variantId) {
            // Find the specific variant from the included list (if any)
            variant =
              product.variants?.find((v) => v.id === itemInput.variantId) ??
              null; // Use nullish coalescing

            if (!variant || !variant.isActive) {
              // Check if variant exists and is active
              throw new Error(
                `Variant ID ${itemInput.variantId} for product ${product.name} not found or is inactive.`
              );
            }
            effectiveSku = variant.sku; // Use variant SKU
            priceModifier = variant.priceModifier; // Use variant price modifier
          } else if (
            (await tx.productVariant.count({
              where: { productId: product.id, isActive: true },
            })) > 0
          ) {
            // Check if active variants exist even if none was provided in input
            throw new Error(
              `Product ${product.name} (ID: ${product.id}) requires a variant selection, but none was provided.`
            );
          }

          // Determine the final unit price for the item
          const unitPrice = itemInput.unitPriceOverride
            ? new Prisma.Decimal(itemInput.unitPriceOverride)
            : basePrice.add(priceModifier);

          // --- Stock Management (FIFO Example) ---
          let quantityToFulfill = itemInput.quantity;
          const availableBatches = await tx.stockBatch.findMany({
            where: {
              productId: itemInput.productId,
              variantId: itemInput.variantId ?? null, // Handle null variantId correctly
              currentQuantity: { gt: 0 }, // Only batches with stock
            },
            orderBy: { receivedDate: "asc" }, // FIFO order
            // select: { id: true, currentQuantity: true, purchasePrice: true } // Select only needed fields
          });

          // Check total available stock for this item/variant
          const currentStock = availableBatches.reduce(
            (sum, batch) => sum + batch.currentQuantity,
            0
          );
          if (currentStock < quantityToFulfill) {
            // Throw a specific, informative error if stock is insufficient
            throw new Error(
              `Insufficient stock for SKU ${effectiveSku}. Required: ${quantityToFulfill}, Available: ${currentStock}`
            );
          }

          // Deduct stock from batches sequentially (FIFO)
          for (const batch of availableBatches) {
            if (quantityToFulfill <= 0) break; // Stop if quantity is fulfilled

            const quantityFromThisBatch = Math.min(
              quantityToFulfill,
              batch.currentQuantity
            );

            // Decrease stock in the current batch
            await tx.stockBatch.update({
              where: { id: batch.id },
              data: {
                currentQuantity: { decrement: quantityFromThisBatch },
              },
            });

            // --- Prepare SaleItem data for this portion ---
            // Calculate amounts for the portion of the item fulfilled by this batch
            const lineSubTotal = unitPrice.mul(quantityFromThisBatch);

            // Distribute the item-level discount proportionally across batches used for that item
            const lineItemDiscountRatio =
              itemInput.quantity > 0
                ? new Prisma.Decimal(itemInput.discountAmount || 0).div(
                    itemInput.quantity
                  )
                : new Prisma.Decimal(0);
            const lineItemDiscount = lineItemDiscountRatio.mul(
              quantityFromThisBatch
            );

            const lineTaxRate = new Prisma.Decimal(itemInput.taxRate || 0);
            const lineTaxableAmount = lineSubTotal.sub(lineItemDiscount); // Tax applied after item discount
            const lineTaxAmount = lineTaxableAmount.mul(lineTaxRate);
            const lineFinalTotal = lineTaxableAmount.add(lineTaxAmount); // Total for this line item segment

            // Add data for the SaleItem record (linked to this specific batch)
            saleItemsToCreate.push({
              productId: itemInput.productId,
              variantId: itemInput.variantId ?? null,
              stockBatchId: batch.id, // Link sale item to the specific stock batch
              quantity: quantityFromThisBatch,
              unitPrice: unitPrice,
              unitCost: batch.purchasePrice, // Cost of Goods Sold from the batch
              discountAmount: lineItemDiscount, // Portion of item discount for this batch
              taxRate: lineTaxRate,
              taxAmount: lineTaxAmount, // Tax amount for this batch portion
              totalAmount: lineFinalTotal, // Final amount for this batch portion
            });

            // Accumulate totals for the overall Sale header record
            calculatedItemSubTotal = calculatedItemSubTotal.add(lineSubTotal);
            calculatedTotalItemDiscount =
              calculatedTotalItemDiscount.add(lineItemDiscount);
            calculatedTotalTax = calculatedTotalTax.add(lineTaxAmount);

            // Decrease remaining quantity to fulfill for the current item input
            quantityToFulfill -= quantityFromThisBatch;
          } // End batch loop for the current item

          // Sanity check: Ensure all quantity was fulfilled (should be guaranteed by initial stock check)
          if (quantityToFulfill > 0) {
            console.error(
              `Stock fulfillment logic error for SKU ${effectiveSku}. Remainder: ${quantityToFulfill}`
            );
            throw new Error(
              `Internal error during stock deduction for SKU ${effectiveSku}.`
            );
          }
        } // End item loop

        // --- 3b. Calculate Final Sale Amounts ---
        const saleLevelDiscount = new Prisma.Decimal(body.discountAmount || 0);

        // `totalAmount` on Sale: Sum of (price * qty) before any discounts or taxes
        const saleTotalAmount = calculatedItemSubTotal;

        // `discountAmount` on Sale: Sum of all item discounts + the sale-level discount
        const saleTotalDiscount =
          calculatedTotalItemDiscount.add(saleLevelDiscount);

        // `taxAmount` on Sale: Sum of all calculated item taxes
        const saleTotalTax = calculatedTotalTax;

        // `finalAmount` on Sale: The final amount the customer pays
        // (Subtotal - Item Discounts + Taxes) - Sale Level Discount
        const grossTotalAfterItemDiscountsAndTaxes = calculatedItemSubTotal
          .sub(calculatedTotalItemDiscount)
          .add(calculatedTotalTax);
        const saleFinalAmount =
          grossTotalAfterItemDiscountsAndTaxes.sub(saleLevelDiscount);

        // Ensure final amount isn't negative (though discounts should ideally be validated)
        if (saleFinalAmount.isNegative()) {
          console.warn(
            `Calculated final amount is negative (${saleFinalAmount}). Capping at 0.`
          );
          // Decide handling: throw error or cap at 0? Capping might hide issues.
          // throw new Error("Final sale amount cannot be negative after discounts.");
        }

        // --- 3c. Generate Unique Sale Number ---
        const saleNumber = `INV-${uuidv4()}`; // Use UUID for uniqueness

        // --- 3d. Create Sale Record ---
        const newSale = await tx.sale.create({
          data: {
            saleNumber: saleNumber,
            // CRITICAL: Use authenticated user ID, NOT from request body
            userId: authenticatedUserId,
            customerId: body.customerId, // Optional customer link
            saleDate: new Date(), // Record time of sale
            totalAmount: saleTotalAmount, // Sum of (unitPrice * quantity) pre-discount/tax
            discountAmount: saleTotalDiscount, // Total of item + sale level discounts
            taxAmount: saleTotalTax, // Sum of item taxes
            finalAmount: saleFinalAmount.isNegative()
              ? new Prisma.Decimal(0)
              : saleFinalAmount, // Final amount charged
            paymentMethod: body.paymentMethod,
            // Consider if payment is truly complete or if further steps are needed (e.g., external gateway)
            paymentStatus: PaymentStatus.COMPLETED, // Defaulting to COMPLETED
            notes: body.notes,
            cashDrawerId: body.cashDrawerId, // Optional link to cash drawer
            // Create related SaleItem records using the prepared data
            items: {
              create: saleItemsToCreate,
            },
          },
          // Include related data in the response for convenience
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, sku: true } },
                variant: { select: { id: true, name: true, sku: true } },
              },
            },
            customer: { select: { id: true, name: true, loyaltyPoints: true } },
            user: { select: { id: true, name: true } },
          },
        });

        // --- 3e. Update Loyalty Points (if customer specified) ---
        if (body.customerId && saleFinalAmount.greaterThan(0)) {
          // Example: 1 point per whole dollar spent on the final amount
          // Adjust logic based on your specific loyalty rules
          const pointsEarned = saleFinalAmount.floor().toNumber();

          if (pointsEarned !== 0) {
            // Update customer's points balance
            await tx.customer.update({
              where: { id: body.customerId },
              data: { loyaltyPoints: { increment: pointsEarned } },
            });

            // Log the loyalty transaction
            await tx.loyaltyTransaction.create({
              data: {
                customerId: body.customerId,
                userId: authenticatedUserId,
                pointsChange: pointsEarned,
                reason: LoyaltyReason.SALE_EARNED,
                relatedSaleId: newSale.id,
                // Add notes if needed
              },
            });
          }
        }

        // --- 3f. Return the created sale data ---
        return newSale;
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    ); // --- End Prisma Transaction ---

    // 4. Send Success Response
    return NextResponse.json(newSaleResult, { status: 201 }); // 201 Created
  } catch (error: unknown) {
    // 5. Handle Errors
    console.error("Sale creation failed:", error);

    let errorMessage = "An unexpected error occurred during sale creation.";
    let statusCode = 500; // Internal Server Error by default

    if (error instanceof z.ZodError) {
      // Should be caught earlier, but handle defensively
      errorMessage = "Invalid request data.";
      statusCode = 400;
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma errors (e.g., unique constraint violation)
      errorMessage = `Database error: ${error.code}`;
      // You might want specific codes, e.g., P2002 for unique constraint
      statusCode = 409; // Conflict for potential DB issues like duplicate saleNumber (if not UUID)
    } else if (error instanceof Error) {
      // Handle specific errors thrown within the transaction
      if (
        error.message.includes("Insufficient stock") ||
        error.message.includes("requires a variant") ||
        error.message.includes("not found or is inactive")
      ) {
        errorMessage = error.message;
        // 409 Conflict for stock issues, 400 Bad Request for validation-like issues
        statusCode = error.message.includes("Insufficient stock") ? 409 : 400;
      } else if (error.message.includes("Unauthorized")) {
        errorMessage = error.message;
        statusCode = 401; // Unauthorized
      }
      // Keep the generic 500 for other unexpected errors
    }

    // Log the error with more context if possible
    // Avoid logging sensitive parts of the request body in production logs
    console.error(`Error details: ${errorMessage}, Status Code: ${statusCode}`);

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// --- GET /api/sales (List Sales) ---

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const paymentMethod = searchParams.get("paymentMethod") as
      | PaymentMethod
      | undefined;
    const paymentStatus = searchParams.get("paymentStatus") as
      | PaymentStatus
      | undefined;
    const dateRange = searchParams.get("dateRange") || undefined;

    // Calculate date range filters
    let dateFilter = {};
    if (dateRange) {
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));

      switch (dateRange) {
        case "today":
          dateFilter = {
            gte: startOfDay,
            lte: endOfDay,
          };
          break;
        case "yesterday":
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          dateFilter = {
            gte: new Date(yesterday.setHours(0, 0, 0, 0)),
            lte: new Date(yesterday.setHours(23, 59, 59, 999)),
          };
          break;
        case "this_week":
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          dateFilter = {
            gte: new Date(startOfWeek.setHours(0, 0, 0, 0)),
            lte: endOfDay,
          };
          break;
        case "last_week":
          const lastWeekStart = new Date();
          lastWeekStart.setDate(
            lastWeekStart.getDate() - lastWeekStart.getDay() - 7
          );
          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
          dateFilter = {
            gte: new Date(lastWeekStart.setHours(0, 0, 0, 0)),
            lte: new Date(lastWeekEnd.setHours(23, 59, 59, 999)),
          };
          break;
        case "this_month":
          dateFilter = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lte: new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              0,
              23,
              59,
              59,
              999
            ),
          };
          break;
        case "last_month":
          dateFilter = {
            gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            lte: new Date(
              now.getFullYear(),
              now.getMonth(),
              0,
              23,
              59,
              59,
              999
            ),
          };
          break;
        case "this_year":
          dateFilter = {
            gte: new Date(now.getFullYear(), 0, 1),
            lte: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
          };
          break;
        case "last_year":
          dateFilter = {
            gte: new Date(now.getFullYear() - 1, 0, 1),
            lte: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
          };
          break;
        // "all_time" has no date filter
      }
    }

    // Build where clause
    const where = {
      AND: [
        search
          ? {
              OR: [
                { saleNumber: { contains: search, mode: "insensitive" } },
                {
                  customer: { name: { contains: search, mode: "insensitive" } },
                },
              ],
            }
          : {},
        paymentMethod ? { paymentMethod } : {},
        paymentStatus ? { paymentStatus } : {},
        Object.keys(dateFilter).length > 0 ? { saleDate: dateFilter } : {},
      ],
    } as Prisma.SaleWhereInput;

    // Get total count for pagination
    const totalCount = await prisma.sale.count({ where });

    // Get paginated sales
    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: {
        saleDate: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      sales,
      totalCount,
    });
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}
