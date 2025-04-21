import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import Decimal from "decimal.js"; // Import Decimal.js for precise calculations

// Helper function to generate a unique sale number (customize as needed)
async function generateSaleNumber(): Promise<string> {
  // Example: Prefix + Timestamp + Random suffix
  // Ensure this logic guarantees uniqueness in your context
  const prefix = "SALE";
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  // Potentially check DB if the number already exists and retry if so
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

// POST handler to create a new sale
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // 1. Validate Input Data
    const validationResult = CreateSaleInputSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("Validation Error:", validationResult.error.errors);
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }
    const saleData: CreateSaleInput = validationResult.data;

    // --- Database Transaction ---
    const createdSale = await prisma.$transaction(async (tx) => {
      console.log(`Starting transaction for localId: ${saleData.localId}`);

      // 2. Fetch Product/Variant Data (within transaction for consistency)
      const productIds = saleData.items.map((item) => item.productId);
      const variantIds = saleData.items
        .map((item) => item.variantId)
        .filter((id): id is string => !!id); // Filter out null/undefined

      const productsInDb = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, basePrice: true }, // Select only needed fields
      });

      const variantsInDb = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, priceModifier: true, productId: true },
      });

      // Map for easy lookup
      const productPriceMap = new Map(
        productsInDb.map((p) => [p.id, p.basePrice])
      );
      const variantPriceMap = new Map(
        variantsInDb.map((v) => [
          v.id,
          { modifier: v.priceModifier, productId: v.productId },
        ])
      );

      // 3. Verify Prices and Calculate Server-Side Totals
      let calculatedTotalAmount = new Decimal(0);
      const saleItemsCreateData: Prisma.SaleItemCreateManySaleInput[] = [];

      for (const item of saleData.items) {
        const basePrice = productPriceMap.get(item.productId);
        if (!basePrice) {
          throw new Error(`Product with ID ${item.productId} not found.`);
        }

        let priceModifier = new Decimal(0);
        if (item.variantId) {
          const variantInfo = variantPriceMap.get(item.variantId);
          if (!variantInfo || variantInfo.productId !== item.productId) {
            throw new Error(
              `Variant with ID ${item.variantId} not found or does not belong to product ${item.productId}.`
            );
          }
          priceModifier = variantInfo.modifier;
        }

        const actualUnitPrice = basePrice.plus(priceModifier);

        // Compare with client price (optional logging/warning if mismatch)
        if (!actualUnitPrice.equals(new Decimal(item.unitPrice))) {
          console.warn(
            `Price mismatch for item ${item.sku}. Client: ${item.unitPrice}, Server: ${actualUnitPrice}. Using server price.`
          );
          // Decide if this should be an error or just a warning
        }

        const itemTotal = actualUnitPrice.times(item.quantity);
        calculatedTotalAmount = calculatedTotalAmount.plus(itemTotal);

        // --- TODO: Stock Check & Deduction ---
        // Find appropriate StockBatch (e.g., FIFO)
        // Check if currentQuantity in batch >= item.quantity
        // Throw error if insufficient stock
        // Get the selected stockBatchId and unitCost from the batch
        // Decrement currentQuantity in the StockBatch:
        // await tx.stockBatch.update({ where: { id: selectedStockBatchId }, data: { currentQuantity: { decrement: item.quantity } } });
        // -------------------------------------

        // Prepare SaleItem data (replace placeholders)
        saleItemsCreateData.push({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: actualUnitPrice, // Use server-verified price
          // --- Replace with actual values after stock logic ---
          stockBatchId: "placeholder_batch_id", // !!! IMPORTANT: Replace with actual batch ID from stock logic
          unitCost: new Decimal(0.0), // !!! IMPORTANT: Get cost from the specific StockBatch used
          taxRate: new Decimal(0.05), // Example: 5% tax rate - Fetch from settings/product if variable
          taxAmount: itemTotal.times(0.05), // Example tax calculation
          discountAmount: new Decimal(0.0), // Add discount logic if needed
          totalAmount: itemTotal.times(1.05), // Example total with tax
          // ---------------------------------------------------
        });
      }

      // 4. Calculate Final Sale Totals (Tax, Discounts etc.)
      // This example uses a simple 5% tax on the total. Implement your real logic.
      const calculatedTaxAmount = calculatedTotalAmount.times(0.05);
      const calculatedDiscountAmount = new Decimal(0.0); // Add discount logic
      const calculatedFinalAmount = calculatedTotalAmount
        .plus(calculatedTaxAmount)
        .minus(calculatedDiscountAmount);

      // 5. Generate Unique Sale Number
      const saleNumber = await generateSaleNumber();

      // 6. Create Sale Record
      const newSale = await tx.sale.create({
        data: {
          saleNumber: saleNumber,
          userId: saleData.userId,
          customerId: saleData.customerId,
          paymentMethod: saleData.paymentMethod,
          notes: saleData.notes,
          // --- Use server-calculated amounts ---
          totalAmount: calculatedTotalAmount,
          discountAmount: calculatedDiscountAmount,
          taxAmount: calculatedTaxAmount,
          finalAmount: calculatedFinalAmount,
          // --- TODO: Determine based on payment method/status ---
          paymentStatus: "COMPLETED", // Or 'PENDING' if async payment
          // --- Link Sale Items ---
          items: {
            createMany: {
              data: saleItemsCreateData,
              skipDuplicates: false, // Should not happen with unique IDs anyway
            },
          },
          // --- TODO: Add CashDrawer relation if applicable ---
          // cashDrawerId: '...',
        },
        // Include items in the response if needed by the client mutation's onSuccess
        include: { items: true },
      });

      // --- TODO: Loyalty Points Logic ---
      // If customerId exists and sale is eligible, create LoyaltyTransaction
      // await tx.loyaltyTransaction.create({ ... });
      // await tx.customer.update({ where: { id: customerId }, data: { loyaltyPoints: { increment: pointsEarned } } });
      // ----------------------------------

      console.log(
        `Transaction successful for localId: ${saleData.localId}, created Sale ID: ${newSale.id}`
      );
      return newSale; // Return the created sale from the transaction
    }); // End of Prisma Transaction

    // 7. Return Success Response
    return NextResponse.json(createdSale, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);

    if (error instanceof ZodError) {
      // Should be caught by safeParse, but good practice
      return NextResponse.json(
        { error: "Invalid input data", details: error.flatten() },
        { status: 400 }
      );
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors (e.g., unique constraint violation)
      if (error.code === "P2002") {
        // Unique constraint failed
        return NextResponse.json(
          {
            error: "Conflict: A similar record already exists.",
            code: error.code,
          },
          { status: 409 }
        );
      }
      if (error.code === "P2025") {
        // Record not found (e.g., product deleted mid-transaction)
        return NextResponse.json(
          { error: "Not Found: Related record missing.", code: error.code },
          { status: 404 }
        );
      }
      // Add more specific error codes if needed
    }
    if (
      error instanceof Error &&
      error.message.includes("Insufficient stock")
    ) {
      // Custom stock error
      return NextResponse.json(
        { error: "Insufficient stock for one or more items." },
        { status: 409 }
      ); // 409 Conflict is suitable
    }

    // Generic server error
    return NextResponse.json(
      { error: "Failed to create sale", details: (error as Error).message },
      { status: 500 }
    );
  }
}
