"use server";

import {
  Prisma,
  Product,
  PaymentMethod,
  Customer,
  PaymentStatus, // Added for Sale creation
  LoyaltyReason, // Added for Loyalty Transaction
  Sale,         // Added for return type clarity
  SaleItem,     // Added for type clarity
} from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { generateAndSaveReceiptPdf } from "@/lib/receiptGenerator";
import { getServerAuthContext } from "./auth";

// --- Type Definitions ---


// Type returned after successful sale (keeping original structure)
interface ProcessSaleResult {
  success: boolean;
  message: string;
  saleId?: string;
  receiptUrl?: string | null;
  error?: string; // Keep structure for validation errors
}

// --- Zod Schemas ---

// Updated Schema to include locationId
const ProcessSaleSchema = z.object({
  cartItems: z
    .array(
      z.object({
        productId: z.string().cuid("Invalid Product ID format."),
        // Variant ID is optional if selling the base product without variants,
        // or if the product has no variants. Check schema relations. [cite: 65, 72, 121, 134, 141]
        variantId: z.string().cuid("Invalid Variant ID format.").optional().nullable(),
        quantity: z.number().int("Quantity must be an integer.").positive("Quantity must be positive."),
      })
    )
    .min(1, "Cart cannot be empty."),
  // Assuming locationId is determined by the POS terminal/session
  // This MUST be provided by the frontend context
  locationId: z.string().cuid("Location ID is required."),
  customerId: z.string().cuid("Invalid Customer ID format.").optional().nullable(),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: "Invalid Payment Method selected." }),
  }),
  discountAmount: z.number().min(0, "Discount cannot be negative.").default(0),
  // Add other potential inputs like notes, cashDrawerId if needed
  cashDrawerId: z.string().cuid("Invalid Cash Drawer ID format.").optional().nullable(),
  notes: z.string().optional(),
});

// Type alias for inferred schema type
// type ProcessSaleInput = z.infer<typeof ProcessSaleSchema>;

// Type for Sale with necessary relations for receipt generation
// Adjust includes based on what generateAndSaveReceiptPdf actually needs
type SaleWithDetails = Sale & {
  items: (SaleItem & {
    product: Product & { category: { name: string } | null };
    variant: { name: string; sku: string } | null; // Select specific variant fields if needed
  })[];
  customer: Customer | null;
  member: { user: { name: string | null } }; // Assuming Member relates to User for name [cite: 11]
  // Add organization details if needed for receipt
  organization: { name: string; /* other fields like address, logo */ };
};

// --- Server Actions ---

/**
 * Search products and variants for the POS interface, scoped by Organization.
 */
export async function searchProductsForPOS(
  query: string,
  locationId: string // Needed to potentially show stock levels
): Promise<Product[]> {
  if (!query || query.trim().length < 2) return [];
  const { organizationId } = await getServerAuthContext();

  try {
    const products = await db.product.findMany({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          { barcode: { equals: query } },
          {
            variants: { // Search active variants [cite: 40]
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
        category: { select: { name: true } }, // [cite: 30]
        variants: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            sku: true,
            priceModifier: true, // [cite: 40]
            // Fetch stock for this specific location
            variantStocks: { // [cite: 41]
              where: { locationId: locationId, organizationId }, // [cite: 130]
              select: { availableStock: true }, // [cite: 131]
            },
          },
        },
        // Include stock for base product if variants aren't used or product has no variants
        // This requires careful handling based on how base products are stocked (often via a default 'variant' or directly)
        // Simplification: Assume stock is primarily tracked per variant using ProductVariantStock
      },
      take: 15,
    });
    return products;
  } catch (error: unknown) {
    console.error(
      `Error searching products for POS (Org: ${organizationId}):`,
      error
    );
    // Depending on policy, either return [] or re-throw a user-friendly error
    return [];
  }
}

/**
 * Search customers for the POS interface, scoped by Organization.
 */
export async function searchCustomersForPOS(
  query: string,
): Promise<Pick<Customer, "id" | "name" | "email" | "loyaltyPoints">[]> {
  if (!query || query.trim().length < 2) return [];
  const { organizationId } = await getServerAuthContext();

  try {
    const customers = await db.customer.findMany({
      where: {
        organizationId,
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
  } catch (error: unknown) {
    console.error(
      `Error searching customers for POS (Org: ${organizationId}):`,
      error
    );
    return [];
  }
}

/**
 * Processes the entire sale transaction.
 */
export async function processSale(
  inputData: unknown // Receive unknown data for safe parsing
): Promise<ProcessSaleResult> {
  // 1. Validate Input Data
  const validation = ProcessSaleSchema.safeParse(inputData);
  if (!validation.success) {
    console.error("POS Sale Validation Error:", validation.error.flatten());
    return {
      success: false,
      message: "Invalid sale data provided.",
      // Return structured validation errors for the frontend
      error: JSON.stringify(validation.error.flatten().fieldErrors),
    };
  }

  // Use validated data
  const {
    cartItems,
    locationId, // Use validated locationId
    customerId,
    paymentMethod,
    discountAmount,
    cashDrawerId, // Use validated optional fields
    notes,
  } = validation.data;

  const { memberId, organizationId } = await getServerAuthContext();

  try {
    const result = await db.$transaction(
      async (tx) => {
        let totalAmount = new Prisma.Decimal(0); // Sum of (unitPrice * quantity) for all items
        const saleItemsCreateData: Omit<
          Prisma.SaleItemCreateManySaleInput,
          "saleId"
        >[] = [];
        // Track updates needed for StockBatch and ProductVariantStock
        const stockBatchUpdates: Map<string, number> = new Map(); // batchId -> quantity change (negative for sale)
        const variantStockUpdates: Map<string, number> = new Map(); // variantStockId -> quantity change (negative for sale)

        // --- Item Processing Loop ---
        for (const item of cartItems) {
          const product = await tx.product.findUnique({
            where: { id: item.productId, isActive: true, organizationId },
            include: {
              // Only include the specific variant if variantId is provided
              variants: item.variantId ? { where: { id: item.variantId, isActive: true } } : false,
            },
          });

          if (!product) {
            throw new Error(`Product ID ${item.productId} not found, is inactive, or does not belong to this organization.`);
          }

          const variant = item.variantId ? product.variants?.[0] : null;
          if (item.variantId && !variant) {
            throw new Error(`Variant ID ${item.variantId} for Product ${item.productId} not found or inactive.`);
          }

          const unitPrice = variant
            ? new Prisma.Decimal(product.basePrice).add(variant.priceModifier) // [cite: 30, 40]
            : new Prisma.Decimal(product.basePrice); // [cite: 30]

          // --- Stock Check and Batch Selection (FIFO within Location) ---
          // Find the oldest stock batch for the specific product/variant at the given location
          const availableBatch = await tx.stockBatch.findFirst({
            where: {
              organizationId,
              locationId, // *** Check stock at the specific POS location *** [cite: 123]
              productId: item.productId,
              variantId: item.variantId, // Null if base product uses null variantId in stock batch
              currentQuantity: { gte: item.quantity }, // [cite: 128]
            },
            orderBy: {
              // Implement FIFO/FEFO based on OrganizationSettings if needed
              receivedDate: "asc", // Default FIFO [cite: 128]
              // expiryDate: 'asc', // For FEFO [cite: 128]
            },
          });

          if (!availableBatch) {
            // Check if negative stock is allowed (requires fetching OrganizationSettings)
             const orgSettings = await tx.organizationSettings.findUnique({ where: { organizationId }}); // [cite: 181]
             if (!orgSettings?.negativeStock) { // [cite: 183]
                throw new Error(`Insufficient stock for ${product.name} ${variant ? `(${variant.name})` : ""}. Required: ${item.quantity} at location ${locationId}.`);
             }
             console.warn(`Proceeding with negative stock for ${product.name} (Variant: ${variant?.id ?? 'N/A'}) at location ${locationId}`);
             // If allowing negative stock, we might skip batch selection or use a placeholder/dummy batch ID.
             // This example continues assuming a batch MUST be found for costing, adjust if needed.
             // For simplicity, error out if no batch is found even if negative stock is allowed,
             // as we need a cost basis (availableBatch.purchasePrice).
              throw new Error(`Insufficient stock batch found for costing ${product.name} ${variant ? `(${variant.name})` : ""}. Required: ${item.quantity} at location ${locationId}.`);

          }
          // --- End Stock Check ---

          const itemTotal = unitPrice.mul(item.quantity);
          totalAmount = totalAmount.add(itemTotal);
          const unitCost = new Prisma.Decimal(availableBatch.purchasePrice); // [cite: 128]

          saleItemsCreateData.push({
            productId: product.id,
            variantId: variant?.id,
            stockBatchId: availableBatch.id, // Link to the specific batch used [cite: 65]
            quantity: item.quantity,
            unitPrice: unitPrice,
            unitCost: unitCost, // Record cost at time of sale [cite: 66]
            discountAmount: new Prisma.Decimal(0), // Item-level discount can be added later
            taxRate: new Prisma.Decimal(0), // Placeholder for tax rate
            taxAmount: new Prisma.Decimal(0), // Placeholder for calculated tax
            totalAmount: itemTotal, // (unitPrice * quantity) before item discount/tax [cite: 67]
          });

          // Aggregate stock updates
          const currentBatchUpdate = stockBatchUpdates.get(availableBatch.id) ?? 0;
          stockBatchUpdates.set(availableBatch.id, currentBatchUpdate - item.quantity);

           // Find the corresponding ProductVariantStock record to update its quantity
           const variantStockRecord = await tx.productVariantStock.findUnique({
               where: {
                   variantId_locationId: { variantId: variant?.id ?? item.productId, locationId: locationId }, // Use productId if variantId is null? Check your stock model logic. Assuming variantId is always present for stock tracking. Need variantId!
                   organizationId,
               },
                select: { id: true }
           });

            if (!variantStockRecord) {
                 // This case should ideally not happen if stock batch exists, but good to check
                 console.error(`Consistency Issue: StockBatch ${availableBatch.id} exists but no ProductVariantStock found for Variant ${variant?.id ?? item.productId} at Location ${locationId}`);
                 // Handle appropriately: maybe create ProductVariantStock if needed, or throw error
                 throw new Error(`Stock tracking inconsistency for variant ${variant?.id}.`)
            }

            const currentVariantStockUpdate = variantStockUpdates.get(variantStockRecord.id) ?? 0;
            variantStockUpdates.set(variantStockRecord.id, currentVariantStockUpdate - item.quantity);


        } // --- End Item Loop ---

        // --- Calculate Final Sale Amounts ---
        const subTotal = totalAmount; // Total before overall discount and tax
        const validatedDiscount = new Prisma.Decimal(discountAmount);

        // Basic validation: Discount shouldn't exceed subtotal
        if (validatedDiscount.greaterThan(subTotal)) {
          throw new Error(`Overall discount (${validatedDiscount}) cannot exceed subtotal (${subTotal}).`);
        }

        // Placeholder: Implement Tax Calculation Logic Here
        // Fetch tax rate from OrganizationSettings or Product/Category
        // const taxRate = await getApplicableTaxRate(tx, organizationId, ...);
        const taxRate = new Prisma.Decimal(0); // Example: 0%
        const taxableAmount = subTotal.sub(validatedDiscount);
        const calculatedTaxAmount = taxableAmount.mul(taxRate).toDecimalPlaces(2); // Ensure 2 decimal places for currency

        const finalAmount = taxableAmount.add(calculatedTaxAmount); // Amount customer pays [cite: 59]

        // --- Create Sale Record ---
        const sale = await tx.sale.create({
          data: {
            saleNumber: `SALE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // Consider a more robust sequence generator
            organizationId,
            memberId: memberId, // *** Use Member ID *** [cite: 58]
            customerId: customerId, // [cite: 58]
            cashDrawerId: cashDrawerId, // [cite: 61]
            // locationId: locationId, // *** Store the location of the sale *** - Added field needed in Sale model? If not, maybe add to notes. Assuming Sale model has locationId. If not add it or use notes.
            saleDate: new Date(), // [cite: 58]
            totalAmount: subTotal, // Sum of item totals before discount/tax [cite: 58]
            discountAmount: validatedDiscount, // Overall sale discount [cite: 59]
            taxAmount: calculatedTaxAmount, // Calculated tax [cite: 59]
            finalAmount: finalAmount, // Final amount charged [cite: 59]
            paymentMethod: paymentMethod, // [cite: 59]
            paymentStatus: PaymentStatus.COMPLETED, // Assuming payment is immediate and successful [cite: 59]
            notes: notes, // [cite: 60]
            // Create SaleItems linked to this sale
            items: {
              createMany: {
                data: saleItemsCreateData,
                skipDuplicates: false, // Should not have duplicates here
              },
            },
          },
          // Include necessary relations for receipt generation and return value
           include: {
              items: {
                  include: {
                      product: { include: { category: { select: { name: true }} } },
                      variant: { select: { name: true, sku: true } }, // Select needed fields
                  },
              },
              customer: true,
              member: { select: { user: { select: { name: true } } } }, // Get user's name via member [cite: 11]
              organization: { select: { name: true /* , other fields */ }}, // Include org details if needed
           }
        });

        // --- Update Stock Levels ---
        // Update Stock Batches
        for (const [batchId, quantityChange] of stockBatchUpdates.entries()) {
          if (quantityChange !== 0) { // Only update if changed
            await tx.stockBatch.update({
              where: { id: batchId },
              data: {
                currentQuantity: {
                  // Increment or decrement based on the sign of quantityChange
                  [quantityChange > 0 ? 'increment' : 'decrement']: Math.abs(quantityChange),
                },
              },
            });
          }
        }
         // Update Product Variant Stock (overall stock count per location)
         for (const [variantStockId, quantityChange] of variantStockUpdates.entries()) {
             if (quantityChange !== 0) {
                 await tx.productVariantStock.update({
                     where: { id: variantStockId },
                     data: {
                         currentStock: {
                             [quantityChange > 0 ? 'increment' : 'decrement']: Math.abs(quantityChange),
                         },
                         // IMPORTANT: Also update availableStock if your logic uses it separately
                         // availableStock: { [quantityChange > 0 ? 'increment' : 'decrement']: Math.abs(quantityChange) }
                         // This depends on whether you use 'reservedStock' workflow
                     }
                 });
             }
         }

        // --- Update Customer Loyalty Points (Example) ---
        if (customerId) {
          // Example: 1 point per $10 spent (adjust logic as needed)
          const pointsEarned = finalAmount.greaterThan(0)
            ? finalAmount.dividedBy(10).floor().toNumber()
            : 0;

          if (pointsEarned > 0) {
            const updatedCustomer = await tx.customer.update({
              where: { id: customerId, organizationId }, // Ensure customer belongs to the org
              data: {
                loyaltyPoints: { increment: pointsEarned }, // [cite: 54]
              },
            });
            // Create a record of the loyalty transaction
            await tx.loyaltyTransaction.create({
              data: {
                organizationId,
                customerId: customerId,
                memberId: memberId, // Member who processed the sale [cite: 228]
                pointsChange: pointsEarned,
                reason: LoyaltyReason.SALE_EARNED, // [cite: 229, 232]
                relatedSaleId: sale.id, // Link loyalty tx to the sale [cite: 229, 230]
              },
            });
            console.log(`Awarded ${pointsEarned} points to customer ${customerId}. New balance: ${updatedCustomer.loyaltyPoints}`);
          }
        }

        // Transaction successful, return the created sale with included details
        return sale as SaleWithDetails; // Cast to the specific type including relations

      }, // End transaction callback
      {
        // Prisma transaction options
        maxWait: 15000, // Max time Prisma waits to acquire a DB connection (ms)
        timeout: 25000, // Max time the transaction can run (ms)
      }
    ); // --- End Database Transaction ---

    // --- Post-Transaction: Generate Receipt ---
    let receiptUrl: string | null = null;
    if (result) { // Check if transaction returned the sale object
       try {
           console.log("Transaction successful, generating receipt for Sale ID:", result.id);
           // Ensure the generateAndSaveReceiptPdf function can handle the 'result' object structure
           receiptUrl = await generateAndSaveReceiptPdf({...result, user: {name:result.member.user.name }, }); // Pass the sale object with relations

           // Update the Sale record with the receipt URL (outside transaction)
           await db.sale.update({
               where: { id: result.id },
               data: { receiptUrl: receiptUrl }, // [cite: 62]
           });
           console.log(`Sale record ${result.id} updated with receipt URL.`);
       } catch (receiptError: unknown) {
           console.error(`Receipt generation/upload failed for Sale ID ${result.id}:`, receiptError);
           // Log this error, perhaps notify admin. Don't fail the whole operation.
       }
    } else {
        // This case should not happen if the transaction doesn't throw, but good to handle
        throw new Error("Transaction completed without returning sale data.");
    }


    // --- Revalidation ---
    revalidatePath("/dashboard/pos"); // Or more specific paths
    // Example: Revalidate product pages if stock changes are critical to display immediately
    // cartItems.forEach(item => revalidatePath(`/products/${item.productId}`));
    if(customerId) revalidatePath(`/customers/${customerId}`);


    // --- Success Response ---
    return {
      success: true,
      message: `Sale ${result.saleNumber} processed successfully.`,
      saleId: result.id,
      receiptUrl: receiptUrl,
    };

  } catch (error: unknown) {
    // --- Error Handling ---
    console.error("POS Sale Processing Error:", error);
    let errorMessage = "Failed to process sale due to an internal error.";
    let errorDetails: string | undefined;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorMessage = `Database error during sale processing. Code: ${error.code}`;
      errorDetails = error.message;
    } else if (error instanceof Prisma.PrismaClientValidationError) {
       errorMessage = "Data validation failed before database operation.";
       errorDetails = error.message;
    } else if (error instanceof Error) {
      // Catch specific errors thrown within the transaction (like stock/validation)
      if (error.message.includes("Insufficient stock") || error.message.includes("not found") || error.message.includes("cannot exceed subtotal")) {
          errorMessage = error.message; // Use the specific error message
      } else {
          errorMessage = "An unexpected error occurred during sale processing.";
          errorDetails = error.message;
      }
    } else {
       errorMessage = "An unknown error occurred."
    }

    return {
      success: false,
      message: errorMessage,
      error: errorDetails || (error instanceof Error ? error.message : "Unknown error details"),
    };
  }
}