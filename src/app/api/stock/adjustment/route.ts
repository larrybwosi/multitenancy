import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  StockAdjustmentReason,
  StockBatch,
} from "@prisma/client";

interface AdjustmentRequestBody {
  // Use Zod
  productId: string;
  variantId?: string;
  stockBatchId?: string; // Optional: Adjust specific batch
  userId: string; // From Auth context
  quantity: number; // Positive or negative integer
  reason: StockAdjustmentReason;
  notes?: string;
  adjustmentDate?: string; // Optional ISO Date string
}

// CREATE Adjustment
export async function POST(request: NextRequest) {
  // Auth check - Ensure user has permission
  // const requestingUserId = "user-placeholder-id"; // Replace with real auth user ID - removed unused variable

  try {
    const body = (await request.json()) as AdjustmentRequestBody;

    // --- Validation ---
    if (
      !body.productId ||
      !body.userId ||
      body.quantity === 0 ||
      !body.reason
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields (productId, userId, quantity, reason)",
        },
        { status: 400 }
      );
    }
    if (!Object.values(StockAdjustmentReason).includes(body.reason)) {
      return NextResponse.json(
        { error: "Invalid adjustment reason" },
        { status: 400 }
      );
    }
    // Ensure quantity is an integer
    if (!Number.isInteger(body.quantity)) {
      return NextResponse.json(
        { error: "Quantity must be an integer" },
        { status: 400 }
      );
    }
    // Verify body.userId matches requestingUserId or user has permission
    // ...

    // --- Transaction ---
    const adjustment = await prisma.$transaction(async (tx) => {
      // 1. Validate Product/Variant exists
      const productExists = await tx.product.findUnique({
        where: { id: body.productId },
      });
      if (!productExists)
        throw new Error(`Product ${body.productId} not found.`);
      if (body.variantId) {
        const variantExists = await tx.productVariant.findUnique({
          where: { id: body.variantId, productId: body.productId },
        });
        if (!variantExists)
          throw new Error(
            `Variant ${body.variantId} not found for product ${body.productId}.`
          );
      }

      // 2. Handle Stock Update
      let targetBatch: StockBatch | null = null;
      if (body.stockBatchId) {
        // Adjusting a SPECIFIC batch
        targetBatch = await tx.stockBatch.findUnique({
          where: { id: body.stockBatchId },
        });
        if (!targetBatch)
          throw new Error(`Stock Batch ${body.stockBatchId} not found.`);
        // Validate batch matches product/variant
        if (
          targetBatch.productId !== body.productId ||
          targetBatch.variantId !== (body.variantId ?? null)
        ) {
          throw new Error(
            `Stock Batch ${body.stockBatchId} does not match the specified product/variant.`
          );
        }

        const newQuantity = targetBatch.currentQuantity + body.quantity;
        if (newQuantity < 0) {
          throw new Error(
            `Adjustment results in negative stock (${newQuantity}) for batch ${body.stockBatchId}. Current: ${targetBatch.currentQuantity}, Adjusting by: ${body.quantity}`
          );
        }
        await tx.stockBatch.update({
          where: { id: body.stockBatchId },
          data: { currentQuantity: newQuantity },
        });
      } else {
        // Adjusting general stock (apply to *some* batch or create if needed?)
        // This logic is TRICKY. For simplicity, we might require a batch ID for adjustments
        // OR implement logic to find a suitable batch (e.g., oldest with stock for decreases, newest for increases?).
        // OR disallow adjustments without batch ID unless it's INITIAL_STOCK?
        // Let's require batch ID for now unless INITIAL_STOCK/FOUND? Needs clear business rule.

        // Simple approach: If no batch ID, adjustment doesn't change specific batch counts
        // This is less accurate for costing but simpler.
        console.warn(
          `Stock adjustment created without a specific batch ID for product ${body.productId}. Total stock counts need recalculation.`
        );
        // A better approach might require finding *a* batch to adjust, or creating a placeholder "adjustment batch"
        const allowedReasons = [
          StockAdjustmentReason.INITIAL_STOCK,
          StockAdjustmentReason.FOUND,
        ];
        if (!allowedReasons.includes(body.reason) && body.quantity < 0) {
          throw new Error(
            `Decrementing adjustments require specifying a stockBatchId.`
          );
        }
        // For INITIAL_STOCK or FOUND without a batch ID, you might create a NEW batch here if desired.
        if (allowedReasons.includes(body.reason) && body.quantity > 0) {
          // Optionally: Create a new batch representing this adjustment
          // Requires fetching product cost price somehow (e.g., default from ProductSupplier or manual input)
          console.log(
            "Creating a new batch for FOUND/INITIAL stock adjustment would require cost price input."
          );
        }
      }

      // 3. Create the Adjustment Record
      const newAdjustment = await tx.stockAdjustment.create({
        data: {
          productId: body.productId,
          variantId: body.variantId,
          stockBatchId: body.stockBatchId, // Link if provided
          userId: body.userId,
          quantity: body.quantity,
          reason: body.reason,
          notes: body.notes,
          adjustmentDate: body.adjustmentDate
            ? new Date(body.adjustmentDate)
            : new Date(),
        },
      });

      return newAdjustment;
    }); // --- End Transaction ---

    return NextResponse.json(adjustment, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create stock adjustment:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    const statusCode =
      errorMessage.includes("negative stock") ||
      errorMessage.includes("not found") ||
      errorMessage.includes("does not match") ||
      errorMessage.includes("require specifying")
        ? 400
        : 500;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}

// LIST Stock Adjustments
export async function GET(request: NextRequest) {
  // Auth check
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  // Filtering
  const productId = searchParams.get("productId");
  const variantId = searchParams.get("variantId");
  const userId = searchParams.get("userId");
  const reason = searchParams.get("reason") as StockAdjustmentReason | null;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  interface WhereClause {
    productId?: string;
    variantId?: string;
    userId?: string;
    reason?: StockAdjustmentReason;
    adjustmentDate?: {
      gte?: Date;
      lte?: Date;
    };
  }

  const where: WhereClause = {};
  if (productId) where.productId = productId;
  if (variantId) where.variantId = variantId; // Note: might need productId too depending on unique constraints
  if (userId) where.userId = userId;
  if (reason) where.reason = reason;

  // Date filtering
  if (startDate || endDate) {
    where.adjustmentDate = {};
    if (startDate) where.adjustmentDate.gte = new Date(startDate);
    if (endDate) where.adjustmentDate.lte = new Date(endDate);
  }

  try {
    // Get total count for pagination
    const totalCount = await prisma.stockAdjustment.count({ where });

    // Get adjustments with pagination
    const adjustments = await prisma.stockAdjustment.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        variant: { select: { name: true, sku: true } },
        user: { select: { name: true, email: true } },
        stockBatch: { select: { batchNumber: true } }, // Removed costPrice which was not in model
      },
      orderBy: [{ adjustmentDate: "desc" }],
      skip,
      take: limit,
    });

    return NextResponse.json({
      data: adjustments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Failed to fetch stock adjustments:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
