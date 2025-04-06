import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  Sale,
  SaleItem,
  StockBatch,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductVariant,
  Customer,
  LoyaltyTransaction,
  User,
  LoyaltyReason,
} from "@prisma/client"; // Ensure all needed types are imported
import { Decimal } from "@prisma/client/runtime/library";

// --- Interfaces (same as before) ---
interface SaleItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPriceOverride?: number;
  discountAmount?: number; // Item-level discount total for this line
  taxRate?: number; // Item-level tax rate (e.g., 0.19)
}
interface CreateSaleRequestBody {
  customerId?: string;
  userId: string; // Should come from auth context
  items: SaleItemInput[];
  paymentMethod: PaymentMethod;
  discountAmount?: number; // Sale-level discount
  // taxAmount?: number; // Usually calculated from items
  notes?: string;
  cashDrawerId?: string;
}
// --- POST function (Transaction logic - same as previously provided, using corrected schema types) ---
export async function POST(request: NextRequest) {
  // Assume requestingUserId obtained from auth middleware/session
  const requestingUserId = "user-placeholder-id"; // Replace with actual auth logic

  try {
    const body = (await request.json()) as CreateSaleRequestBody;

    // --- Input validation (Use Zod preferably) ---
    if (
      !body.userId ||
      !body.items ||
      body.items.length === 0 ||
      !body.paymentMethod
    ) {
      return NextResponse.json(
        { error: "Missing required sale data (userId, items, paymentMethod)" },
        { status: 400 }
      );
    }
    // Verify requesting user has permission or matches body.userId if applicable
    // ...

    // --- Prisma Transaction ---
    const result = await prisma.$transaction(async (tx) => {
      let calculatedSubTotal = new Decimal(0); // Sum of (unitPrice * quantity) before discounts/taxes
      let calculatedTotalItemDiscount = new Decimal(0);
      let calculatedTotalTax = new Decimal(0);
      const saleItemsToCreateData: Omit<
        SaleItem,
        | "id"
        | "saleId"
        | "createdAt"
        | "updatedAt"
        | "sale"
        | "product"
        | "variant"
        | "stockBatch"
      >[] = [];

      // --- 1. Process Items, Check & Decrement Stock ---
      for (const itemInput of body.items) {
        if (itemInput.quantity <= 0) continue;

        // Fetch Product/Variant details
        const product = await tx.product.findUnique({
          where: { id: itemInput.productId },
          include: {
            variants: itemInput.variantId
              ? { where: { id: itemInput.variantId } }
              : false,
          },
        });

        if (!product?.isActive)
          throw new Error(
            `Product ${itemInput.productId} not found or inactive.`
          );

        let variant: ProductVariant | null = null;
        let effectiveSku = product.sku;
        let basePrice = product.basePrice;
        let priceModifier = new Decimal(0);

        if (itemInput.variantId) {
          variant =
            product.variants.find((v) => v.id === itemInput.variantId) ?? null;
          if (!variant?.isActive)
            throw new Error(
              `Variant ${itemInput.variantId} not found or inactive.`
            );
          effectiveSku = variant.sku;
          priceModifier = variant.priceModifier;
        } else if (product.variants.length > 0) {
          throw new Error(
            `Product ${product.name} requires a variant selection.`
          );
        }

        const unitPrice = itemInput.unitPriceOverride
          ? new Decimal(itemInput.unitPriceOverride)
          : basePrice.add(priceModifier);

        // Find and decrement stock batches (FIFO example)
        let quantityToFulfill = itemInput.quantity;
        const availableBatches = await tx.stockBatch.findMany({
          where: {
            productId: itemInput.productId,
            variantId: itemInput.variantId ?? null,
            currentQuantity: { gt: 0 },
          },
          orderBy: { receivedDate: "asc" }, // FIFO
        });

        const currentStock = availableBatches.reduce(
          (sum, batch) => sum + batch.currentQuantity,
          0
        );
        if (currentStock < quantityToFulfill) {
          throw new Error(
            `Insufficient stock for SKU ${effectiveSku}. Required: ${quantityToFulfill}, Available: ${currentStock}`
          );
        }

        // Deduct from batches
        for (const batch of availableBatches) {
          if (quantityToFulfill <= 0) break;
          const quantityFromThisBatch = Math.min(
            quantityToFulfill,
            batch.currentQuantity
          );

          await tx.stockBatch.update({
            where: { id: batch.id },
            data: { currentQuantity: { decrement: quantityFromThisBatch } },
          });

          // Prepare SaleItem data for this portion
          const lineSubTotal = unitPrice.mul(quantityFromThisBatch);
          // Distribute item discount proportionally if provided *for the line*
          const lineItemDiscount = new Decimal(itemInput.discountAmount || 0)
            .mul(quantityFromThisBatch)
            .div(itemInput.quantity);
          const lineTaxRate = new Decimal(itemInput.taxRate || 0);
          const lineTaxableAmount = lineSubTotal.sub(lineItemDiscount);
          const lineTaxAmount = lineTaxableAmount.mul(lineTaxRate);
          const lineFinalTotal = lineTaxableAmount.add(lineTaxAmount);

          saleItemsToCreateData.push({
            productId: itemInput.productId,
            variantId: itemInput.variantId ?? null,
            stockBatchId: batch.id,
            quantity: quantityFromThisBatch,
            unitPrice: unitPrice,
            unitCost: batch.purchasePrice, // Cost from batch
            discountAmount: lineItemDiscount,
            taxRate: lineTaxRate,
            taxAmount: lineTaxAmount,
            totalAmount: lineFinalTotal,
          });

          // Accumulate totals for the Sale header
          calculatedSubTotal = calculatedSubTotal.add(lineSubTotal);
          calculatedTotalItemDiscount =
            calculatedTotalItemDiscount.add(lineItemDiscount);
          calculatedTotalTax = calculatedTotalTax.add(lineTaxAmount);

          quantityToFulfill -= quantityFromThisBatch;
        } // End batch loop
      } // End item loop

      // --- 2. Calculate Final Sale Amounts ---
      const saleLevelDiscount = new Decimal(body.discountAmount || 0);
      // finalAmount = (Sum of item totals) - Sale Level Discount
      // The totalAmount on Sale header could be sum of item totalAmounts OR pre-discount/tax subtotal. Let's use sum of item totals.
      const grossTotalFromItems = calculatedSubTotal
        .sub(calculatedTotalItemDiscount)
        .add(calculatedTotalTax);
      const finalAmount = grossTotalFromItems.sub(saleLevelDiscount);

      // --- 3. Generate Sale Number ---
      // Implement your logic e.g., POS-YYYYMMDD-Sequence
      const saleNumber = `INV-${Date.now()}`; // Basic example

      // --- 4. Create Sale Record ---
      const newSale = await tx.sale.create({
        data: {
          saleNumber: saleNumber,
          customerId: body.customerId,
          userId: body.userId, // Use ID from request body or auth context
          saleDate: new Date(),
          totalAmount: calculatedSubTotal, // Sum of (price*qty) across items
          discountAmount: calculatedTotalItemDiscount.add(saleLevelDiscount), // Sum of item + sale discounts
          taxAmount: calculatedTotalTax, // Sum of item taxes
          finalAmount: finalAmount,
          paymentMethod: body.paymentMethod,
          paymentStatus: PaymentStatus.COMPLETED, // Assume immediate completion
          notes: body.notes,
          cashDrawerId: body.cashDrawerId,
          items: {
            create: saleItemsToCreateData, // Create related items
          },
        },
        include: {
          // Include items in response
          items: {
            include: {
              product: { select: { name: true, sku: true } },
              variant: { select: { name: true, sku: true } },
            },
          },
          customer: { select: { name: true } },
          user: { select: { name: true } },
        },
      });

      // --- 5. Update Loyalty Points (if customer specified) ---
      if (body.customerId && finalAmount.greaterThan(0)) {
        // Example: 1 point per dollar spent
        const pointsEarned = Math.floor(finalAmount.toNumber());
        if (pointsEarned !== 0) {
          // Allow negative for returns later maybe
          await tx.customer.update({
            where: { id: body.customerId },
            data: { loyaltyPoints: { increment: pointsEarned } },
          });
          await tx.loyaltyTransaction.create({
            data: {
              customerId: body.customerId,
              userId: body.userId,
              pointsChange: pointsEarned,
              reason: LoyaltyReason.SALE_EARNED,
              relatedSaleId: newSale.id, // Link to the sale
            },
          });
        }
      }

      return newSale; // Return the created sale with details
    }); // --- End Prisma Transaction ---

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Sale creation failed:", error);
    // Provide specific feedback if possible
    const errorMessage =
      error.message.includes("Insufficient stock") ||
      error.message.includes("requires a variant")
        ? error.message
        : "Internal Server Error during sale creation";
    const statusCode = error.message.includes("Insufficient stock") ? 409 : 500; // 409 Conflict for stock issue
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// --- GET /api/sales (List Sales) ---
export async function GET(request: NextRequest) {
  // Add Auth checks
  const { searchParams } = new URL(request.url);
  // Basic pagination
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  // Filtering options (examples)
  const customerId = searchParams.get("customerId");
  const userId = searchParams.get("userId");
  const status = searchParams.get("status") as PaymentStatus | null; // Validate enum
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: any = {}; // Build where clause dynamically
  if (customerId) where.customerId = customerId;
  if (userId) where.userId = userId;
  if (status && Object.values(PaymentStatus).includes(status))
    where.paymentStatus = status;
  if (startDate && endDate) {
    where.saleDate = {
      gte: new Date(startDate),
      lte: new Date(endDate + "T23:59:59.999Z"), // Include full end day
    };
  } else if (startDate) {
    where.saleDate = { gte: new Date(startDate) };
  } else if (endDate) {
    where.saleDate = { lte: new Date(endDate + "T23:59:59.999Z") };
  }

  try {
    const [sales, totalCount] = await prisma.$transaction([
      prisma.sale.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
          items: {
            // Include item count or brief summary if needed
            select: { id: true }, // Just count items maybe
          },
        },
        orderBy: { saleDate: "desc" },
        skip: skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: sales,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Failed to fetch sales:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
