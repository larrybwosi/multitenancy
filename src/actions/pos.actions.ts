'use server';

import {
  Prisma,
  Product,
  PaymentMethod,
  Customer,
  PaymentStatus,
  LoyaltyReason,
  Sale,
  SaleItem,
  Member,
  ProductVariant,
  ProductVariantStock,
} from '@prisma/client';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { generateAndSaveReceiptPdf } from '@/lib/receiptGenerator';
import { getServerAuthContext } from './auth';

// --- Type Definitions ---

// Type returned after successful sale (keeping original structure)
type ProcessSaleResult = {
  success: boolean;
  message: string;
  saleId?: string;
  receiptUrl?: string | null;
  error?: string | object; // Return structured error or message string
};

// --- Zod Schemas ---

// Updated Schema to include locationId
const ProcessSaleSchema = z.object({
  cartItems: z
    .array(
      z.object({
        productId: z.string().cuid('Invalid Product ID format.'),
        // Variant ID is optional if selling the base product without variants,
        // or if the product has no variants. Check schema relations. [cite: 65, 72, 121, 134, 141]
        variantId: z.string().cuid('Invalid Variant ID format.').optional().nullable(),
        quantity: z.number().int('Quantity must be an integer.').positive('Quantity must be positive.'),
      })
    )
    .min(1, 'Cart cannot be empty.'),
  // Assuming locationId is determined by the POS terminal/session
  // This MUST be provided by the frontend context
  locationId: z.string().cuid('Location ID is required.'),
  customerId: z.string().cuid('Invalid Customer ID format.').optional().nullable(),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Invalid Payment Method selected.' }),
  }),
  discountAmount: z.number().min(0, 'Discount cannot be negative.').default(0),
  // Add other potential inputs like notes, cashDrawerId if needed
  cashDrawerId: z.string().cuid('Invalid Cash Drawer ID format.').optional().nullable(),
  notes: z.string().optional(),
});

// Type for Sale with necessary relations for receipt generation
// Adjust includes based on what generateAndSaveReceiptPdf actually needs
export type SaleWithDetails = Sale & {
  items: (SaleItem & {
    product: Product & { category?: { name: string } };
    variant: ProductVariant | null;
  })[];
  customer: Customer | null;
  member: Member & { user: { name: string | null } }; // [cite: 11]
  organization: { name: string /*, other fields */ };
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
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { barcode: { equals: query } },
          {
            variants: {
              // Search active variants [cite: 40]
              some: {
                isActive: true,
                OR: [
                  { name: { contains: query, mode: 'insensitive' } },
                  { sku: { contains: query, mode: 'insensitive' } },
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
            variantStocks: {
              // [cite: 41]
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
    console.error(`Error searching products for POS (Org: ${organizationId}):`, error);
    // Depending on policy, either return [] or re-throw a user-friendly error
    return [];
  }
}

/**
 * Search customers for the POS interface, scoped by Organization.
 */
export async function searchCustomersForPOS(
  query: string
): Promise<Pick<Customer, 'id' | 'name' | 'email' | 'loyaltyPoints'>[]> {
  if (!query || query.trim().length < 2) return [];
  const { organizationId } = await getServerAuthContext();

  try {
    const customers = await db.customer.findMany({
      where: {
        organizationId,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, email: true, loyaltyPoints: true },
      take: 10,
    });
    return customers;
  } catch (error: unknown) {
    console.error(`Error searching customers for POS (Org: ${organizationId}):`, error);
    return [];
  }
}
/**
 * Processes the entire sale transaction, including input validation,
 * stock checks, database operations within a transaction, receipt generation,
 * and cache revalidation.
 *
 * @param inputData - Raw input data for the sale, expected to conform to ProcessSaleSchema.
 * @returns Promise<ProcessSaleResult> - An object indicating success or failure,
 * along with relevant data (saleId, receiptUrl) or error details.
 */
export async function processSale(
  inputData: unknown // Receive unknown data for safe parsing
): Promise<ProcessSaleResult> {
  // --- 1. Validate Input Data ---
  const validation = ProcessSaleSchema.safeParse(inputData);
  if (!validation.success) {
    const flatErrors = validation.error.flatten();
    console.error('POS Sale Input Validation Failed:', {
      errors: flatErrors.fieldErrors,
      inputData: inputData // Log the problematic input for debugging
    });
    return {
      success: false,
      message: 'Invalid sale data provided. Please check the fields.',
      // Return structured validation errors for better frontend feedback
      error: flatErrors.fieldErrors,
    };
  }

  // --- 2. Prepare Validated Data & Context ---
  const validatedData = validation.data;
  const {
    cartItems,
    locationId,
    customerId,
    paymentMethod,
    discountAmount, // Keep as number for now, convert to Decimal in transaction
    cashDrawerId,
    notes,
  } = validatedData;

  let memberId: string;
  let organizationId: string;
  try {
    // Retrieve authenticated user context (memberId and organizationId)
    const authContext = await getServerAuthContext(); // Replace with your actual auth context retrieval
    memberId = authContext.memberId;
    organizationId = authContext.organizationId;
    if (!memberId || !organizationId) {
        throw new Error("User authentication context (memberId, organizationId) not found.");
    }
    console.log(`Processing sale for Org: ${organizationId}, Member: ${memberId}, Location: ${locationId}`);
  } catch (authError: unknown) {
      console.error('Authentication context retrieval failed:', authError);
      return { success: false, message: 'Failed to retrieve user authentication context.', error: (authError instanceof Error ? authError.message : 'Unknown auth error') };
  }

  // --- 3. Database Transaction ---
  try {
    // Fetch organization-specific settings (Tax Rate, Negative Stock Policy) BEFORE the main transaction
    // This avoids redundant queries inside the loop if possible.
    const orgSettings = await db.organizationSettings.findUnique({
        where: { organizationId },
        select: { defaultTaxRate: true, negativeStock: true, inventoryPolicy: true }, // [cite: 185, 186]
    });
    const taxRate = orgSettings?.defaultTaxRate ?? new Prisma.Decimal(0); // Use Decimal, default to 0 [cite: 185]
    const allowNegativeStock = orgSettings?.negativeStock ?? false; // [cite: 186]
    // TODO: Implement different inventory policies (FIFO/FEFO) based on orgSettings.inventoryPolicy [cite: 186]
    const inventoryPolicy = orgSettings?.inventoryPolicy ?? 'FIFO'; // Default to FIFO


    // Start the Prisma transaction for atomicity
    const result = await db.$transaction(
      async (tx) => { // tx is the Prisma TransactionClient
        let transactionSubTotal = new Prisma.Decimal(0); // Sum of (unitPrice * quantity) for all items, before sale discount/tax
        const saleItemsCreateData: Omit<Prisma.SaleItemCreateManySaleInput, 'saleId'>[] = [];

        // Track stock updates efficiently to avoid redundant DB calls within the loop
        // Map: batchId -> quantity change (negative for sale)
        const stockBatchUpdates: Map<string, number> = new Map();
        // Map: productVariantStockId -> quantity change (negative for sale)
        const variantStockUpdates: Map<string, { id: string; change: number }> = new Map();


        // --- 3a. Item Processing Loop ---
        for (const item of cartItems) {
          // Log item processing start
          console.log(`Processing Item: Product ${item.productId}, Variant ${item.variantId ?? 'N/A'}, Qty ${item.quantity}`);

          // Validate Product and Variant existence and activity
          // Fetch product and the specific variant (if applicable) in one go
          const product = await tx.product.findUnique({
            where: { id: item.productId, isActive: true, organizationId }, // Ensure product belongs to the org [cite: 39]
            include: {
              // Conditionally include variant only if variantId is provided
              variants: item.variantId
                ? { where: { id: item.variantId, isActive: true, organizationId } } // Ensure variant belongs to the org [cite: 41]
                : false, // Don't include variants if no variantId is specified
            },
          });

          if (!product) {
            throw new Error(`Product ID ${item.productId} not found, is inactive, or does not belong to organization ${organizationId}.`);
          }

          const variant = item.variantId ? product.variants?.[0] : null;
          if (item.variantId && !variant) {
            throw new Error(`Variant ID ${item.variantId} for Product ${item.productId} not found, inactive, or does not belong to organization ${organizationId}.`);
          }
          // CRITICAL:  The schema requires ProductVariantStock.variantId to be non-null[cite: 133].
          // If a product *can* be sold without variants, the schema/logic needs a way to represent this.
          // Assumption: For this code, if item.variantId is null, it implies selling the base product,
          // BUT stock must still be tracked via a 'default' or base ProductVariant record associated with the product.
          // This function currently requires item.variantId for stock lookup. Adjust if base products are handled differently.
           if (!item.variantId) {
             // If your system allows selling base products without explicit variants, you need a mechanism
             // to find the corresponding ProductVariantStock record (e.g., a default variant ID associated with the product).
             // For now, we'll throw an error if variantId is missing, as required by the schema for stock lookup.
             console.error(`Missing variantId for product ${item.productId}. Stock lookup requires a variantId.`);
             throw new Error(`Configuration Error: Cannot process product ${item.productId} without a specific variantId for stock tracking.`);
           }
          const stockLookupVariantId = item.variantId; // Use the validated variantId


          // Determine Unit Price (Base Price + Variant Modifier)
          const unitPrice = variant
            ? new Prisma.Decimal(product.basePrice).add(variant.priceModifier) // [cite: 30, 40]
            : new Prisma.Decimal(product.basePrice); // [cite: 30]

          // --- 3b. Stock Check and Batch Selection (FIFO/FEFO within Location) ---
          // Find the oldest (FIFO) or soonest-expiring (FEFO) stock batch with sufficient quantity
          const availableBatch = await tx.stockBatch.findFirst({
            where: {
              organizationId,
              locationId, // Filter by the specific POS location [cite: 123]
              productId: item.productId,
              variantId: stockLookupVariantId, // Use the explicit variantId for lookup [cite: 121]
              currentQuantity: { gte: item.quantity }, // Check if batch has enough quantity [cite: 128]
            },
            //TODO: Add ordering based on inventory policy
            // orderBy: {
            //   // Select ordering based on inventory policy
            //   ...(inventoryPolicy === 'FEFO' && { expiryDate: 'asc' }), // [cite: 128]
            //   receivedDate: 'asc', // FIFO is default or fallback for FEFO with null expiry [cite: 128]
            // },
          });

          if (!availableBatch) {
            // If no single batch has enough, check if negative stock is allowed
            if (!allowNegativeStock) {
              // Query total stock at location to provide a more helpful error
               const totalStock = await tx.productVariantStock.findUnique({
                 where: {
                   variantId_locationId: { variantId: stockLookupVariantId, locationId: locationId }, // [cite: 135]
                   organizationId
                 },
                 select: { currentStock: true }
               });
              const currentStockCount = totalStock?.currentStock ?? 0;
              console.error(`Insufficient stock: Prod=${item.productId}, Var=${stockLookupVariantId}, Loc=${locationId}. Required: ${item.quantity}, Available: ${currentStockCount}. Negative stock disabled.`);
              throw new Error(
                `Insufficient stock for ${product.name} ${variant ? `(${variant.name})` : ''}. Required: ${item.quantity}, Available: ${currentStockCount} at location ${locationId}.`
              );
            } else {
                // Negative stock is allowed, but we still need a cost basis.
                // Option 1: Find *any* batch (even with 0 qty) to get a cost (e.g., last purchase price).
                // Option 2: Use the product's baseCost [cite: 32] or average cost (requires more complex query).
                // Option 3: Error out if NO batch exists at all for costing (simplest for now).
                const lastBatchForCost = await tx.stockBatch.findFirst({
                   where: { organizationId, locationId, productId: item.productId, variantId: stockLookupVariantId },
                   orderBy: { receivedDate: 'desc' }, // Get the most recent batch for cost reference
                });

                if (!lastBatchForCost) {
                    console.error(`Insufficient stock AND no batch found for costing: Prod=${item.productId}, Var=${stockLookupVariantId}, Loc=${locationId}.`);
                    throw new Error(
                        `Insufficient stock for ${product.name} ${variant ? `(${variant.name})` : ''} and no purchase batch found at location ${locationId} to determine cost.`
                    );
                }
                 console.warn(
                   `Proceeding with negative stock for Prod=${item.productId}, Var=${stockLookupVariantId}, Loc=${locationId}. Required: ${item.quantity}. Using cost from last batch: ${lastBatchForCost.id}`
                 );
                // Assign the cost from the found batch, but we won't decrease its quantity below zero (handled by ProductVariantStock update).
                // Note: We are *not* assigning availableBatch here, only using lastBatchForCost for the unitCost.
                 const unitCost = new Prisma.Decimal(lastBatchForCost.purchasePrice); // [cite: 128]
                // Add item data, but without a specific source batch ID or handle this case specially if needed.
                // Forcing an error here as SaleItem requires a stockBatchId [cite: 65]
                // A potential solution is to create a "dummy" or "negative stock" batch placeholder if absolutely needed.
                 console.error(`Schema Constraint: SaleItem requires a stockBatchId, but no batch with sufficient quantity found, even with negative stock enabled.`);
                 throw new Error(`System Configuration Error: Cannot record sale item without a valid stock batch ID, even when negative stock is allowed.`);

                // --- If SaleItem.stockBatchId was Optional ---
                // saleItemsCreateData.push({ ... }); // Add item with null stockBatchId
                // stockBatchIdToUpdate = null; // Indicate no specific batch to decrement
                // unitCost = unitCost; // Use cost from lastBatchForCost

            }
          }

          // If we found a suitable batch:
           const unitCost = new Prisma.Decimal(availableBatch.purchasePrice); // Cost from the selected batch [cite: 66, 128]
           const itemTotal = unitPrice.mul(item.quantity);
           transactionSubTotal = transactionSubTotal.add(itemTotal); // Add to overall subtotal

          // Prepare data for SaleItem creation
          saleItemsCreateData.push({
            productId: product.id,
            variantId: variant?.id, // Use the actual variant ID [cite: 65]
            stockBatchId: availableBatch.id, // Link to the specific batch used [cite: 65]
            quantity: item.quantity,
            unitPrice: unitPrice, // Price at time of sale [cite: 67]
            unitCost: unitCost, // Cost at time of sale [cite: 66]
            discountAmount: new Prisma.Decimal(0), // Placeholder for potential item-level discount logic
            taxRate: new Prisma.Decimal(taxRate), // Apply org default tax rate (can be item-specific later) [cite: 67]
            taxAmount: new Prisma.Decimal(0), // Calculated later if needed per item
            totalAmount: itemTotal, // (unitPrice * quantity) before item discount/tax [cite: 67]
          });

          // --- 3c. Aggregate Stock Updates (In Memory) ---
          // Decrement StockBatch quantity
          const currentBatchUpdate = stockBatchUpdates.get(availableBatch.id) ?? 0;
          stockBatchUpdates.set(availableBatch.id, currentBatchUpdate - item.quantity);

           // Decrement ProductVariantStock quantity
          const variantStockRecord = await tx.productVariantStock.findUnique({
            where: {
              variantId_locationId: { variantId: stockLookupVariantId, locationId: locationId }, // [cite: 135]
              organizationId,
            },
            select: { id: true },
          });


          if (!variantStockRecord) {
             // This case should ideally not happen if a StockBatch exists, indicates potential data inconsistency.
             // However, if negative stock is allowed, this might be the first time stock goes below zero.
            console.warn(
              `Consistency Warning: StockBatch ${availableBatch.id} exists, but no corresponding ProductVariantStock found for Var=${stockLookupVariantId}, Loc=${locationId}. Trying to create one.`
            );
            // Attempt to create the missing ProductVariantStock record.
             const newVariantStock = await createMissingVariantStock(
               tx,
               product.id, // [cite: 133]
               organizationId,
               stockLookupVariantId, // The non-null variant ID [cite: 133]
               locationId, // [cite: 133]
               -item.quantity // Start with the negative quantity from this sale
             );
             // Track update for the newly created record
             variantStockUpdates.set(stockLookupVariantId + "_" + locationId, { id: newVariantStock.id, change: -item.quantity });

          } else {
            // Aggregate update for the existing ProductVariantStock record
            const key = stockLookupVariantId + "_" + locationId;
            const currentVariantStockUpdate = variantStockUpdates.get(key)?.change ?? 0;
             variantStockUpdates.set(key, { id: variantStockRecord.id, change: currentVariantStockUpdate - item.quantity });
          }

        } // --- End Item Loop ---


        // --- 3d. Calculate Final Sale Amounts ---
        const saleSubTotal = transactionSubTotal;
        const saleDiscount = new Prisma.Decimal(discountAmount); // Convert input number to Decimal

        // Validate discount amount
        if (saleDiscount.greaterThan(saleSubTotal)) {
            console.error(`Validation Error: Discount (${saleDiscount}) exceeds subtotal (${saleSubTotal}).`);
          throw new Error(`Overall discount (${saleDiscount.toFixed(2)}) cannot exceed subtotal (${saleSubTotal.toFixed(2)}).`);
        }

        const taxableAmount = saleSubTotal.sub(saleDiscount);
        // Ensure tax calculation uses Decimal and rounds appropriately
        const calculatedTaxAmount = taxableAmount.mul(taxRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const finalAmount = taxableAmount.add(calculatedTaxAmount); // Final amount customer pays [cite: 59]

        console.log(`Sale Calculation: SubTotal=${saleSubTotal}, Discount=${saleDiscount}, Taxable=${taxableAmount}, TaxRate=${taxRate}, TaxAmount=${calculatedTaxAmount}, Final=${finalAmount}`);


        // --- 3e. Create Sale Record ---
        // Consider a more robust sequence generator for production (e.g., database sequence or UUID)
        const saleNumber = `SALE-${Math.random().toString(36).substring(4, 10).toUpperCase()}-${new Date().getTime().toString().slice(0,4)}`; // [cite: 58]
        console.log(`Creating Sale record: ${saleNumber}`);

        const sale = await tx.sale.create({
          data: {
            saleNumber: saleNumber, // [cite: 58]
            organizationId: organizationId, // [cite: 21]
            memberId: memberId, // Member processing the sale [cite: 58]
            customerId: customerId, // Optional customer [cite: 58]
            cashDrawerId: cashDrawerId, // Optional cash drawer [cite: 61]
            locationId: locationId, // Record the location of the sale (Added based on context, ensure schema has this)
            saleDate: new Date(), // [cite: 58]
            totalAmount: saleSubTotal, // Sum of item totals BEFORE discount/tax [cite: 58]
            discountAmount: saleDiscount, // Overall sale discount [cite: 59]
            taxAmount: calculatedTaxAmount, // Calculated tax for the whole sale [cite: 59]
            finalAmount: finalAmount, // Final amount charged [cite: 59]
            paymentMethod: paymentMethod, // [cite: 59]
            paymentStatus: PaymentStatus.COMPLETED, // Assume payment is immediate and successful [cite: 59]
            notes: notes ?? `POS Sale at location ${locationId} on ${new Date().toLocaleString()}`, // [cite: 60]
            // Create SaleItems linked to this sale using prepared data
            items: {
              createMany: {
                data: saleItemsCreateData,
                skipDuplicates: false, // Should not have duplicates here
              },
            },
          },
          // Include relations needed for the return value and receipt generation
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, category: { select: { name: true } } } }, // Include necessary product fields
                variant: { select: { id: true, name: true, sku: true } }, // Include necessary variant fields [cite: 41]
              },
            },
            customer: true, // [cite: 58]
            member: { select: { id: true, user: { select: { name: true } } } }, // Get member and user's name [cite: 11]
            organization: { select: { id: true, name: true, logo: true,  } }, // [cite: 17]
            // Include location if added to Sale schema: location: { select: { id: true, name: true } }
          },
        });
        console.log(`Sale record ${sale.id} created successfully.`);


        // --- 3f. Apply Aggregated Stock Updates ---
        // Update Stock Batches
        console.log(`Applying Stock Batch updates:`, stockBatchUpdates);
        for (const [batchId, quantityChange] of stockBatchUpdates.entries()) {
          if (quantityChange !== 0) { // Ensure there's a change to apply
             // Use decrement operation for clarity and atomicity
             await tx.stockBatch.update({
                 where: { id: batchId },
                 data: {
                     currentQuantity: {
                         decrement: Math.abs(quantityChange), // quantityChange is negative for sales
                     },
                 },
             });
          }
        }

        // Update Product Variant Stock (overall stock count per location)
        console.log(`Applying Product Variant Stock updates:`, variantStockUpdates);
        // Note: variantStockUpdates is a Map with keys as "variantId_locationId"
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
         for (const [key, update] of variantStockUpdates.entries()) {
          if (update.change !== 0) { // Ensure there's a change to apply
            await tx.productVariantStock.update({
              where: { id: update.id },
              data: {
                currentStock: {
                  // Use increment/decrement based on the sign
                    [update.change > 0 ? 'increment' : 'decrement']: Math.abs(update.change),
                },
                // IMPORTANT: Also update availableStock if your logic uses it separately.
                // This depends on whether you implement a 'reservedStock' workflow.
                // availableStock: { [update.change > 0 ? 'increment' : 'decrement']: Math.abs(update.change) } // [cite: 134]
            },
            });
          }
         }
         console.log(`Stock levels updated successfully.`);


        // --- 3g. Update Customer Loyalty Points (Example) ---
        if (customerId && finalAmount.greaterThan(0)) {
           // Example: 1 point per $10 spent (adjust rule as needed)
           // Ensure division handles potential floating point issues if necessary, floor confirms integer points.
           const pointsEarned = finalAmount.dividedBy(10).floor().toNumber();

          if (pointsEarned > 0) {
            console.log(`Awarding ${pointsEarned} loyalty points to customer ${customerId} for sale ${sale.id}`);
             // Update customer points atomically
             const updatedCustomer = await tx.customer.update({
               where: { id: customerId, organizationId }, // Ensure customer belongs to the org
               data: {
                 loyaltyPoints: { increment: pointsEarned }, // [cite: 54]
               },
             });

            // Create a record of the loyalty transaction for history
            await tx.loyaltyTransaction.create({
              data: {
                organizationId: organizationId,
                customerId: customerId, // [cite: 231]
                memberId: memberId, // Member who processed the sale [cite: 232]
                pointsChange: pointsEarned,
                reason: LoyaltyReason.SALE_EARNED, // [cite: 235]
                relatedSaleId: sale.id, // Link loyalty tx to the sale [cite: 232]
                transactionDate: new Date(), // [cite: 234]
              },
            });
            console.log(`Awarded ${pointsEarned} points to customer ${customerId}. New balance: ${updatedCustomer.loyaltyPoints}`);
          }
        }

        // --- 3h. Transaction Success ---
        // Transaction successful, return the created sale with included details
        console.log(`Transaction completed successfully for Sale ID: ${sale.id}`);
        return sale; // Cast to the specific type including relations

      }, // End transaction callback
      {
        // Prisma transaction options
        maxWait: 15000, // Max time Prisma waits to acquire a DB connection (ms)
        timeout: 30000, // Max time the *entire transaction* can run (ms) - Increased slightly
      }
    ); // --- End Database Transaction ---


    // --- 4. Post-Transaction: Generate Receipt ---
    let receiptUrl: string | null = null;
    if (result) { // Ensure the transaction returned the sale object
      try {
        console.log(`Attempting receipt generation for Sale ID: ${result.id}`);
        // Pass the structured sale object, ensuring user name is available
        // Note: `result.member.user.name` is included in the query
         const receiptInput = {
           ...result, // Spread the SaleWithDetails object
           // Ensure user object structure matches what generateAndSaveReceiptPdf expects
           // If it needs just the name directly:
           // userName: result.member.user.name
         };
         
         receiptUrl = await generateAndSaveReceiptPdf(receiptInput); // Pass the necessary data [cite: 62]

        // Update the Sale record with the receipt URL (outside transaction, best effort)
        if (receiptUrl) {
            await db.sale.update({
                where: { id: result.id },
                data: { receiptUrl: receiptUrl }, // [cite: 62]
            });
            console.log(`Sale record ${result.id} updated with receipt URL: ${receiptUrl}`);
        } else {
             console.warn(`Receipt generation did not return a URL for Sale ID ${result.id}.`);
        }

      } catch (receiptError: unknown) {
        // Log receipt errors but don't fail the entire sale process
        console.error(`Receipt generation/upload failed critically for Sale ID ${result.id}:`, {
          errorMessage: receiptError instanceof Error ? receiptError.message : 'Unknown receipt error',
          errorDetails: receiptError,
         });
         // Optionally: Trigger an alert for manual intervention
      }
    } else {
      // This case should theoretically not happen if the transaction succeeded without error,
      // but it's a safeguard.
      console.error('Transaction seemed successful but returned no result object.');
      throw new Error('Transaction completed without returning expected sale data.');
    }

    // --- 5. Cache Revalidation ---
    // Revalidate relevant paths to reflect changes (e.g., stock levels, customer points)
    console.log('Revalidating relevant paths...');
    revalidatePath('/dashboard/pos'); // General POS dashboard
    revalidatePath('/dashboard/sales'); // Sales list
    revalidatePath(`/dashboard/sales/${result.id}`); // Specific sale detail page
    cartItems.forEach(item => {
       revalidatePath(`/dashboard/inventory/products/${item.productId}`); // Product stock page
       if (item.variantId) {
           revalidatePath(`/dashboard/inventory/variants/${item.variantId}`); // Variant stock page (if applicable)
       }
    });
    if (customerId) {
      revalidatePath(`/dashboard/customers/${customerId}`); // Customer detail page
    }
    console.log('Path revalidation complete.');


    // --- 6. Success Response ---
    return {
      success: true,
      message: `Sale ${result.saleNumber} processed successfully.`,
      saleId: result.id,
      receiptUrl: receiptUrl, // Include the generated receipt URL
    };

  } catch (error: unknown) {
    // --- 7. Comprehensive Error Handling ---
    console.error('--- POS Sale Processing CRITICAL ERROR ---');
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error(`Organization: ${organizationId}, Member: ${memberId}, Location: ${locationId}`);
    console.error(`Input Data (if available):`, validatedData ?? inputData); // Log validated or raw input
    console.error('Error Details:', error);
    console.error('--- End Error Report ---');


    let errorMessage = 'Failed to process sale due to an internal error.';
    let errorDetails: string | object | undefined; // Allow structured details

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Specific database constraint errors, etc.
        errorMessage = `Database error processing sale. Please try again or contact support if persistent. (Code: ${error.code})`;
        errorDetails = { code: error.code, meta: error.meta, message: error.message };
        // Example: Handle unique constraint violation specifically
        if (error.code === 'P2002') { // Unique constraint failed
            errorMessage = `Error: A record with this identifier (e.g., sale number) already exists.`;
        }
    } else if (error instanceof Prisma.PrismaClientValidationError) {
        // Errors in data shape before hitting the DB
        errorMessage = 'Data validation failed during database operation. Check input format.';
        errorDetails = error.message;
    } else if (error instanceof z.ZodError) {
         // Should be caught earlier, but as a fallback
         errorMessage = 'Invalid input data format detected during processing.';
         errorDetails = error.flatten().fieldErrors;
    } else if (error instanceof Error) {
      // Catch specific errors thrown within the transaction (like stock/validation)
      // Check for common operational errors first
      if (
        error.message.includes('Insufficient stock') ||
        error.message.includes('not found') || // Includes product/variant not found
        error.message.includes('cannot exceed subtotal') || // Discount error
        error.message.includes('requires a variantId') // Configuration error
      ) {
        errorMessage = error.message; // Use the specific, user-friendly error message
        errorDetails = error.stack; // Provide stack trace for debugging
      } else {
          // General unexpected errors from logic
          errorMessage = 'An unexpected error occurred during sale processing.';
          errorDetails = { message: error.message, stack: error.stack };
      }
    } else {
      // Fallback for non-standard errors
      errorMessage = 'An unknown error occurred during sale processing.';
      errorDetails = String(error); // Convert unknown error to string
    }

    // Return standardized error response
    return {
      success: false,
      message: errorMessage, // User-facing message
      error: errorDetails ?? 'No further details available.', // Internal error details
    };
  }
}


/**
 * Helper function to create a ProductVariantStock record within a transaction
 * when one is missing but expected (e.g., during negative stock sales).
 * Ensures alignment with the Prisma schema.
 *
 * @param tx - The Prisma transaction client.
 * @param productId - The ID of the base product. [cite: 133]
 * @param organizationId - The ID of the organization.
 * @param variantId - The non-null ID of the product variant being tracked. [cite: 133]
 * @param locationId - The ID of the inventory location. [cite: 133]
 * @param initialQuantity - The starting quantity (usually negative for a sale creating it).
 * @returns The newly created ProductVariantStock record.
 * @throws Error if variantId is null or creation fails.
 */
async function createMissingVariantStock(
    tx: Prisma.TransactionClient, // Use Prisma.TransactionClient type
    productId: string,
    organizationId: string,
    variantId: string, // Schema requires variantId to be non-null [cite: 133]
    locationId: string,
    initialQuantity: number
): Promise<ProductVariantStock> { // Return the correct Prisma type

    // Log the creation attempt with crucial identifiers
    console.log(
        `Attempting to create missing ProductVariantStock: Org=${organizationId}, Prod=${productId}, Var=${variantId}, Loc=${locationId}, InitialQty=${initialQuantity}`
    );

    try {
        // Create the ProductVariantStock record
        const newVariantStock = await tx.productVariantStock.create({
            data: {
                organizationId: organizationId,
                productId: productId, // [cite: 133]
                variantId: variantId, // Use the provided non-null variantId [cite: 133]
                locationId: locationId, // [cite: 133]
                currentStock: initialQuantity, // Set initial stock (likely negative) [cite: 134]
                // Defaults for other fields like reservedStock, reorderPoint, reorderQty will be applied by Prisma based on schema [cite: 134]
                // availableStock is often calculated, not directly set - check your exact logic/schema needs
            },
        });

        console.log(`Successfully created new ProductVariantStock record with ID: ${newVariantStock.id}`);
        return newVariantStock;
    } catch (error: unknown) {
         console.error(`Failed to create missing ProductVariantStock: Org=${organizationId}, Var=${variantId}, Loc=${locationId}`, error);
         // Re-throw the error to potentially roll back the transaction
         if (error instanceof Error) {
             throw new Error(`Failed to create missing stock record: ${error.message}`);
         }
         throw new Error('An unknown error occurred while creating the missing stock record.');
    }
}