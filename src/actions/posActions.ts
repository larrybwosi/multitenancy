// app/actions/posActions.js
"use server";

import prisma from "@/lib/db";
import { CreateSaleSchema,  } from "@/lib/schemas"; // Adjust path if needed
import { Prisma } from "@prisma/client"; // Import Prisma namespace for Decimal

// Helper function to generate a unique sale number (example)
async function generateSaleNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const timePart = now.toTimeString().slice(0, 8).replace(/:/g, ""); // HHMMSS
  // Add randomness or sequence for uniqueness in high-volume scenarios
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SALE-${datePart}-${timePart}-${randomPart}`;
}

export async function createSaleAction(formData: FormData) {
  // Hardcoded user for example purposes. Replace with actual authenticated user ID.

  const rawData = {
    customerId: formData.get("customerId") || null,
    // userId: HARDCODED_USER_ID, // Replace with dynamic user ID from session
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes") || '',
    items: JSON.parse(formData.get("items") || "[]"), // Expect items as JSON string
  };

  // Validate the core structure
  const validationResult = CreateSaleSchema.safeParse(rawData);

  if (!validationResult.success) {
    console.error(
      "Validation Errors:",
      validationResult.error.flatten().fieldErrors
    );
    return {
      success: false,
      message: "Invalid sale data.",
      errors: validationResult.error.flatten().fieldErrors,
    };
  }

  const validatedData = validationResult.data;

  try {
    // Start transaction
    const result = await prisma.$transaction(
      async (tx) => {
        let totalAmount = new Prisma.Decimal(0);
        const saleItemsData = [];
        const stockUpdates = [];

        // 1. Fetch product details and calculate totals securely
        for (const item of validatedData.items) {
          const productInfo = await tx.product.findUnique({
            where: { id: item.productId },
            select: {
              id: true,
              basePrice: true,
              variants: {
                // Fetch variant price if variantId is provided
                where: { id: item.variantId ?? undefined },
                select: { priceModifier: true, id: true },
              },
            },
          });

          if (!productInfo) {
            throw new Error(`Product not found: ID ${item.productId}`);
          }

          let unitPrice = productInfo.basePrice;
          let actualVariantId = null;

          // Adjust price if a valid variant is selected
          if (item.variantId && productInfo.variants.length > 0) {
            const variant = productInfo.variants[0];
            unitPrice = unitPrice.add(variant.priceModifier); // Add modifier
            actualVariantId = variant.id;
          } else if (item.variantId) {
            console.warn(
              `Variant ${item.variantId} requested but not found for product ${item.productId}. Using base product.`
            );
            // Decide if this should be an error or fallback
            // throw new Error(`Variant not found: ${item.variantId} for Product ${item.productId}`);
          }

          // --- Simplified Stock Check & Cost Fetch ---
          // Find *any* stock batch with sufficient quantity. Real-world needs FIFO/LIFO etc.
          // Also, fetch the cost price from the batch for accurate profit calculation.
          const stockBatch = await tx.stockBatch.findFirst({
            where: {
              productId: item.productId,
              variantId: actualVariantId, // Match variant if applicable
              currentQuantity: { gte: item.quantity },
            },
            orderBy: {
              receivedDate: "asc", // Basic FIFO attempt
            },
            select: { id: true, purchasePrice: true, currentQuantity: true }, // Fetch ID and cost
          });

          if (!stockBatch) {
            throw new Error(
              `Insufficient stock for product ID ${item.productId}${actualVariantId ? ` (Variant ID ${actualVariantId})` : ""}`
            );
          }
          // --- End Stock Check ---

          const itemTotal = unitPrice.mul(item.quantity);
          totalAmount = totalAmount.add(itemTotal);

          saleItemsData.push({
            productId: item.productId,
            variantId: actualVariantId,
            stockBatchId: stockBatch.id, // Link sale item to the specific batch used
            quantity: item.quantity,
            unitPrice: unitPrice,
            unitCost: stockBatch.purchasePrice, // Use cost from the batch
            // Add tax/discount logic here if needed per item
            taxRate: new Prisma.Decimal(0), // Example: 0 tax
            taxAmount: new Prisma.Decimal(0),
            discountAmount: new Prisma.Decimal(0),
            totalAmount: itemTotal,
          });

          // Prepare stock update
          stockUpdates.push(
            tx.stockBatch.update({
              where: { id: stockBatch.id },
              data: {
                currentQuantity: {
                  decrement: item.quantity,
                },
              },
            })
          );
        } // End loop through items

        // 2. Create the Sale record
        const newSale = await tx.sale.create({
          data: {
            saleNumber: await generateSaleNumber(),
            customerId: validatedData.customerId,
            // userId: validatedData.userId,
            totalAmount: totalAmount,
            discountAmount: new Prisma.Decimal(0), // Example: Calculate overall discount later if needed
            taxAmount: new Prisma.Decimal(0), // Example: Calculate overall tax later if needed
            finalAmount: totalAmount, // Adjust if discount/tax applied
            paymentMethod: validatedData.paymentMethod,
            paymentStatus: "COMPLETED", // Assume immediate completion for simple POS
            notes: validatedData.notes,
            items: {
              create: saleItemsData, // Create SaleItems linked to this sale
            },
            // Add relations like cashDrawerId if applicable
          },
          select: { id: true, saleNumber: true }, // Select fields to return
        });

        // 3. Execute stock updates (after successful sale creation)
        await Promise.all(stockUpdates);

        // 4. Optional: Update customer loyalty points
        // if (validatedData.customerId) { ... tx.customer.update(...) ... }

        return newSale; // Return the created sale info
      },
      {
        maxWait: 10000, // 10 seconds
        timeout: 20000, // 20 seconds
      }
    ); // End transaction

    return {
      success: true,
      message: `Sale ${result.saleNumber} created successfully.`,
      saleId: result.id,
    };
  } catch (error) {
    console.error("Sale Creation Error:", error);
    // Handle specific Prisma errors if needed (e.g., unique constraint violation)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // e.g. error.code === 'P2002' for unique constraint
      return { success: false, message: `Database error: ${error.message}` };
    }
    return {
      success: false,
      message: error.message || "Failed to create sale.",
    };
  }
}
