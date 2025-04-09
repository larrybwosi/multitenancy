"use server";

import { Prisma, Product, PaymentMethod, Customer } from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { generateAndSaveReceiptPdf } from "@/lib/receiptGenerator"; 

// --- Type Definitions ---
// Types for data coming from the POS client
// interface CartItemInput {
//   productId: string;
//   variantId?: string | null; // Can be null if it's the base product
//   quantity: number;
//   unitPrice: number; // Price *at the time of adding to cart* (can be overridden by Product price)
//   // name/sku could be included for display but shouldn't be trusted for logic
// }

// interface PaymentDetailsInput {
//   paymentMethod: PaymentMethod;
//   // Add more fields if needed (e.g., transaction reference, card details - handle securely!)
// }

// Type returned after successful sale
interface ProcessSaleResult {
  success: boolean;
  message: string;
  saleId?: string;
  receiptUrl?: string | null; // Changed from boolean to string
  error?: string;
}

// --- Zod Schemas (for validation) ---
// Note: Full validation of cart contents against DB prices/stock is complex
// We'll perform key checks within the transaction.
const ProcessSaleSchema = z.object({
  cartItems: z
    .array(
      z.object({
        productId: z.string().cuid(),
        variantId: z.string().cuid().optional().nullable(),
        quantity: z.number().int().positive(),
        // unitPrice: z.number().positive(), // Price might be re-fetched server-side
      })
    )
    .min(1, "Cart cannot be empty."),
  customerId: z.string().cuid().optional().nullable(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  discountAmount: z.number().min(0).default(0), // Optional discount applied to total
  // taxAmount: z.number().min(0).default(0), // Tax calculated server-side
  userId: z.string().cuid(), // Should come from auth context
});

// --- Server Actions ---

/**
 * Search products and variants for the POS interface.
 */
export async function searchProductsForPOS(query: string): Promise<Product[]> {
  if (!query || query.trim().length < 2) return []; // Don't search for very short queries

  try {
    const products = await db.product.findMany({
      where: {
        isActive: true, // Only active products
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          { barcode: { equals: query } },
          {
            // Search matching variant names/skus
            variants: {
              some: {
                isActive: true,
                OR: [
                  { name: { contains: query, mode: "insensitive" } },
                  { sku: { contains: query, mode: "insensitive" } },
                  { barcode: { equals: query } },
                ],
              },
            },
          },
        ],
      },
      include: {
        category: { select: { name: true } },
        variants: {
          // Include active variants
          where: { isActive: true },
          select: { id: true, name: true, sku: true, priceModifier: true },
        },
        // Optional: Fetch stock levels here if needed immediately for display
        // stockBatches: { where: { currentQuantity: { gt: 0 } }, select: { currentQuantity: true }}
      },
      take: 15, // Limit results
    });
    return products;
  } catch (error) {
    console.error("Error searching products for POS:", error);
    return []; // Return empty on error
  }
}

/**
 * Search customers for the POS interface.
 */
export async function searchCustomersForPOS(
  query: string
): Promise<Pick<Customer, "id" | "name" | "email" | "loyaltyPoints">[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const customers = await db.customer.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true, loyaltyPoints: true },
      take: 10,
    });
    return customers;
  } catch (error) {
    console.error("Error searching customers for POS:", error);
    return [];
  }
}

/**
 * Processes the entire sale transaction. VERY IMPORTANT: Uses db.$transaction.
 */
export async function processSale(
  inputData: z.infer<typeof ProcessSaleSchema>
): Promise<ProcessSaleResult> {
  const validation = ProcessSaleSchema.safeParse(inputData);
  if (!validation.success) {
    console.error(
      "POS Sale Validation Error:",
      validation.error.flatten().fieldErrors
    );
    return {
      success: false,
      message: "Invalid sale data.",
      error: JSON.stringify(validation.error.flatten().fieldErrors),
    };
  }

  const { cartItems, customerId, paymentMethod, discountAmount, userId } =
    validation.data;

  try {
    // --- Start Database Transaction ---
    const result = await db.$transaction(
      async (tx) => {
        let totalAmount = new Prisma.Decimal(0);
        const saleItemsData: Omit<
          Prisma.SaleItemCreateManySaleInput,
          "saleId"
        >[] = [];
        const stockUpdates: { batchId: string; quantityChange: number }[] = [];

        // 1. Fetch product/variant details and validate stock within transaction
        for (const item of cartItems) {
          const product = await tx.product.findUnique({
            where: { id: item.productId, isActive: true },
            include: {
              variants: {
                where: { id: item.variantId ?? undefined, isActive: true },
              },
            },
          });

          if (!product)
            throw new Error(
              `Product ID ${item.productId} not found or inactive.`
            );

          const variant = item.variantId
            ? product.variants.find((v) => v.id === item.variantId)
            : null;
          if (item.variantId && !variant)
            throw new Error(
              `Variant ID ${item.variantId} for Product ${item.productId} not found or inactive.`
            );

          const unitPrice = variant
            ? product.basePrice.add(variant.priceModifier)
            : product.basePrice;

          // --- Simplified Stock Handling ---
          // Find the first available batch (oldest received) with enough stock. Needs improvement for real POS.
          const availableBatch = await tx.stockBatch.findFirst({
            where: {
              productId: item.productId,
              variantId: item.variantId, // Match variant if specified
              currentQuantity: { gte: item.quantity }, // Enough stock
            },
            orderBy: {
              receivedDate: "asc", // FIFO principle
            },
          });

          if (!availableBatch) {
            throw new Error(
              `Insufficient stock for ${product.name} ${variant ? `(${variant.name})` : ""}. Required: ${item.quantity}.`
            );
          }
          // --- End Simplified Stock Handling ---

          const itemTotal = unitPrice.mul(item.quantity);
          totalAmount = totalAmount.add(itemTotal);

          saleItemsData.push({
            productId: product.id,
            variantId: variant?.id,
            stockBatchId: availableBatch.id, // Link to the specific batch used
            quantity: item.quantity,
            unitPrice: unitPrice,
            unitCost: availableBatch.purchasePrice, // Use cost from the batch!
            discountAmount: new Prisma.Decimal(0), // Item-level discount not implemented here
            taxRate: new Prisma.Decimal(0), // Tax calculation logic needed
            taxAmount: new Prisma.Decimal(0),
            totalAmount: itemTotal,
          });

          // Prepare stock update
          stockUpdates.push({
            batchId: availableBatch.id,
            quantityChange: -item.quantity,
          });
        }

        // 2. Calculate final amounts (implement tax logic as needed)
        const subTotal = totalAmount;
        const validatedDiscount = new Prisma.Decimal(discountAmount).toDecimalPlaces(
          2
        );
        if (validatedDiscount.greaterThan(subTotal))
          throw new Error("Discount cannot exceed subtotal.");
        const taxAmount = new Prisma.Decimal(0); // Placeholder - Calculate tax based on subtotal - discount
        const finalAmount = subTotal.sub(validatedDiscount).add(taxAmount);

        // 3. Create the Sale record
        const sale = await tx.sale.create({
          data: {
            saleNumber: `SALE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Simple unique number
            userId: userId, // Assumes userId is valid CUID from auth
            customerId: customerId,
            saleDate: new Date(),
            totalAmount: subTotal,
            discountAmount: validatedDiscount,
            taxAmount: taxAmount,
            finalAmount: finalAmount,
            paymentMethod: paymentMethod,
            paymentStatus: "COMPLETED", // Assuming payment is successful
            notes: "Sale processed via POS.",
            items: {
              // Create SaleItems linked to this sale
              createMany: {
                data: saleItemsData,
              },
            },
            // receiptUrl will be added later, outside transaction if generation succeeds
          },
          include: {
            // Include items for receipt generation data
            items: {
              include: {
                product: { include: { category: true } },
                variant: true,
              },
            },
            customer: true, // Include customer details
            user: { select: { name: true } }, // Include user name
          },
        });

        // 4. Update Stock Batches
        for (const update of stockUpdates) {
          await tx.stockBatch.update({
            where: { id: update.batchId },
            data: {
              currentQuantity: {
                decrement: Math.abs(update.quantityChange), // Ensure positive decrement value
              },
            },
          });
        }

        // 5. Update Customer Loyalty Points (Example: 1 point per $10)
        if (customerId) {
          const pointsEarned = Math.floor(finalAmount.dividedBy(10).toNumber()); // Example logic
          if (pointsEarned > 0) {
            const updatedCustomer = await tx.customer.update({
              where: { id: customerId },
              data: {
                loyaltyPoints: {
                  increment: pointsEarned,
                },
              },
            });
            await tx.loyaltyTransaction.create({
              data: {
                customerId: customerId,
                userId: userId,
                pointsChange: pointsEarned,
                reason: "SALE_EARNED",
                relatedSaleId: sale.id, // Link loyalty tx to the sale
              },
            });
            console.log(
              `Awarded ${pointsEarned} points to customer ${customerId}. New balance: ${updatedCustomer.loyaltyPoints}`
            );
          }
        }

        // If all steps succeed, the transaction will commit. Return sale details.
        return sale; // Return the created sale with included relations
      },
      {
        // Transaction options (e.g., timeout)
        timeout: 20000, // 20 seconds timeout for the transaction
      }
    );
    // --- End Database Transaction ---

    // 6. Generate and Save Receipt (outside the main DB transaction)
    let receiptUrl: string | null = null;
    try {
      console.log(
        "Transaction successful, generating receipt for Sale ID:",
        result.id
      );
      receiptUrl = await generateAndSaveReceiptPdf(result); // Cast result type

      // Update the Sale record with the receipt URL
      await db.sale.update({
        where: { id: result.id },
        data: { receiptUrl: receiptUrl },
      });
      console.log("Sale record updated with receipt URL.");
    } catch (receiptError) {
      console.error(
        `Receipt generation/upload failed for Sale ID ${result.id}:`,
        receiptError
      );
      // Sale is already committed. Log error, maybe notify admin or allow manual regeneration.
      // Don't fail the overall POS operation here.
    }

    // Revalidate POS paths (or relevant product/customer paths if needed)
    revalidatePath("/dashboard/pos");
    // Potentially revalidate product stock views or customer detail views

    return {
      success: true,
      message: `Sale ${result.saleNumber} processed successfully.`,
      saleId: result.id,
      receiptUrl: receiptUrl,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("POS Sale Processing Error:", error);
    let errorMessage = "Failed to process sale due to an internal error.";
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors if needed
      errorMessage = `Database error during sale processing: ${error.message}`;
    } else if (
      error.message.includes("Insufficient stock") ||
      error.message.includes("not found")
    ) {
      // Catch errors thrown from within the transaction
      errorMessage = error.message;
    }
    return {
      success: false,
      message: errorMessage,
      error: error.message || "Unknown error",
    };
  }
}
