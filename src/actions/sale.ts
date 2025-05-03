import { PaymentMethod, Prisma, PrismaClient } from '@prisma/client'; // Assuming Prisma client import
import { z } from 'zod'; // Assuming Zod for validation
import { getServerAuthContext } from './auth';
import { revalidatePath } from 'next/cache'; // Assuming Next.js cache revalidation
import { AuditLogAction, AuditEntityType, LoyaltyReason, PaymentStatus, ProductVariantStock } from '@prisma/client';
import { generateAndSaveReceiptPdf } from '@/lib/receiptGenerator';
import { createAuditLog } from '@/lib/audits/logger';
// Define db instance (replace with your actual Prisma instance)
const db = new PrismaClient();

// --- Define Input Schema (Including the new flag) ---
// NOTE: You'll need to adjust your frontend or calling code to provide this flag.
const ProcessSaleInputSchema = z.object({
  cartItems: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional().nullable(), // Variant might be optional depending on product setup
      quantity: z.number().int().positive(),
      // Add other potential item-specific fields if needed (e.g., item-level discount)
    })
  ),
  locationId: z.string(),
  customerId: z.string().optional().nullable(),
  paymentMethod: z.nativeEnum(PaymentMethod), // Use PaymentMethod enum
  discountAmount: z.number().nonnegative().default(0),
  cashDrawerId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  enableStockTracking: z.boolean(), // *** NEW FLAG ***
});

// --- Define Result Type ---
// Define a more specific type for the successful result data including relations
type SaleWithDetails = Prisma.SaleGetPayload<{
  include: {
    items: {
      include: {
        product: { select: { id: true; name: true; category: { select: { name: true } } } };
        variant: { select: { id: true; name: true; sku: true } };
      };
    };
    customer: true;
    member: { select: { id: true; user: { select: { name: true } } } };
    organization: { select: { id: true; name: true; logo: true } };
    location: { select: { id: true; name: true } }; // Include location if added to Sale schema
  };
}>;

type ProcessSaleResult =
  | {
      success: true;
      message: string;
      saleId: string;
      data: SaleWithDetails; // Use the detailed type
      receiptUrl: string | null;
    }
  | {
      success: false;
      message: string;
      error?: string | object; // More specific error type
    };

/**
 * Processes the entire sale transaction based on input data.
 * Features include:
 * - Input validation against a defined schema.
 * - Optional stock level checking and adjustment based on the `enableStockTracking` flag.
 * - Database operations (Sale, SaleItem creation, optional Stock updates) within a transaction for atomicity.
 * - Calculation of totals, discounts, and taxes.
 * - Optional customer loyalty point updates.
 * - Receipt generation (best-effort after transaction).
 * - Cache revalidation for affected data.
 * - Comprehensive error handling and logging.
 *
 * @param inputData - Raw input data for the sale, expected to conform to `ProcessSaleInputSchema`.
 * @returns Promise<ProcessSaleResult> - An object indicating success or failure,
 * along with relevant data (saleId, detailed sale object, receiptUrl) or error details.
 */
export async function processSale(
  inputData: unknown // Receive unknown data for safe parsing
): Promise<ProcessSaleResult> {
  // --- 1. Validate Input Data ---
  // Safely parse the input against the schema, including the new enableStockTracking flag.
  const validation = ProcessSaleInputSchema.safeParse(inputData);
  if (!validation.success) {
    const flatErrors = validation.error.flatten();
    console.error('POS Sale Input Validation Failed:', {
      errors: flatErrors.fieldErrors,
      inputData: inputData, // Log the problematic input for debugging
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
    enableStockTracking, // *** Extract the new flag ***
  } = validatedData;

  // Context variables to be populated
  let memberId: string;
  let organizationId: string;

  // Retrieve essential user and organization context. Fails the process if unavailable.
  try {
    const authContext = await getServerAuthContext(); 
    if (!authContext?.memberId || !authContext?.organizationId) {
      throw new Error('User authentication context (memberId, organizationId) not found.');
    }
    memberId = authContext.memberId;
    organizationId = authContext.organizationId;
    console.log(
      `Processing sale for Org: ${organizationId}, Member: ${memberId}, Location: ${locationId}, Stock Tracking: ${enableStockTracking}`
    );
  } catch (authError: unknown) {
    console.error('Authentication context retrieval failed:', authError);
    return {
      success: false,
      message: 'Failed to retrieve user authentication context.',
      error: authError instanceof Error ? authError.message : 'Unknown auth error',
    };
  }

  // --- 3. Database Transaction ---
  // All database writes occur within a transaction to ensure atomicity.
  // If any step fails, the entire transaction is rolled back.
  try {
    // Fetch organization-specific settings BEFORE the main transaction
    // to avoid redundant queries inside the loop if possible.
    const orgSettings = await db.organizationSettings.findUnique({
      where: { organizationId },
      select: {
        defaultTaxRate: true, // [cite: 184]
        negativeStock: true, // [cite: 185]
        inventoryPolicy: true, // [cite: 185]
      },
    });

    // Determine tax rate and negative stock allowance from settings, providing defaults.
    const taxRate = orgSettings?.defaultTaxRate ?? new Prisma.Decimal(0); // Use Decimal, default to 0 [cite: 184]
    const allowNegativeStock = orgSettings?.negativeStock ?? false; // [cite: 185]
    // Determine inventory policy (e.g., FIFO/FEFO) - Currently defaults to FIFO
    // TODO: Implement different inventory policies based on orgSettings.inventoryPolicy [cite: 185]
    const inventoryPolicy = orgSettings?.inventoryPolicy ?? 'FIFO'; 
    console.log(`Inventory Policy: ${inventoryPolicy}`);

    // Start the Prisma transaction
    const result = await db.$transaction(
      async tx => {
        // tx is the Prisma TransactionClient, use it for all DB operations within the transaction.

        let transactionSubTotal = new Prisma.Decimal(0); // Sum of (unitPrice * quantity) for all items, before sale discount/tax
        const saleItemsCreateData: Omit<Prisma.SaleItemCreateManySaleInput, 'saleId'>[] = [];

        // In-memory maps to aggregate stock updates for efficiency.
        // These are only applied to the DB if enableStockTracking is true.
        // Map: batchId -> quantity change (negative for sale)
        const stockBatchUpdates: Map<string, number> = new Map();
        // Map: composite key "variantId_locationId" -> { id: productVariantStockId, change: quantity change }
        const variantStockUpdates: Map<string, { id: string; change: number }> = new Map();

        // --- 3a. Item Processing Loop ---
        // Process each item in the cart individually.
        for (const item of cartItems) {
          console.log(
            `Processing Item: Product ${item.productId}, Variant ${item.variantId ?? 'N/A'}, Qty ${item.quantity}`
          );

          // Fetch the product and its specific variant (if applicable) ensuring they are active and belong to the org.
          const product = await tx.product.findUnique({
            where: {
              id: item.productId,
              isActive: true,
              organizationId, // Ensure product belongs to the org [cite: 38]
            },
            include: {
              // Conditionally include the specific variant if variantId is provided
              variants: item.variantId
                ? { where: { id: item.variantId, isActive: true } } // Ensure variant is active [cite: 41]
                : false, // Don't include variants if no variantId is specified
            },
          });

          // Validate product existence
          if (!product) {
            throw new Error(
              `Product ID ${item.productId} not found, is inactive, or does not belong to organization ${organizationId}.`
            );
          }

          // Validate variant existence if a variantId was provided
          const variant = item.variantId ? product.variants?.[0] : null;
          if (item.variantId && !variant) {
            throw new Error(
              `Variant ID ${item.variantId} for Product ${item.productId} not found or is inactive.` // Org check implicitly done via product
            );
          }

          // Determine the Unit Price for the item (from the variant if applicable).
          // Assumes variant.retailPrice holds the correct price. Adjust if base product price needs merging.
          const unitPrice = variant?.retailPrice; // [cite: 41]
          if (unitPrice === undefined || unitPrice === null) {
            // Fallback or error if price is missing (adjust based on business rules)
            console.error(`Price missing for Product ${item.productId}, Variant ${item.variantId ?? 'Base'}`);
            throw new Error(`Retail price not set for ${product.name} ${variant ? `(${variant.name})` : ''}.`);
          }
          const itemTotal = new Prisma.Decimal(unitPrice).mul(item.quantity); // Calculate item total (qty * price) before tax/discount

          // --- Stock Handling (Lookup is ALWAYS needed due to schema, Updates are conditional) ---
          let unitCost = new Prisma.Decimal(0); // Default cost if tracking disabled or no batch found
          let selectedStockBatchId: string | null = null;

          // CRITICAL Schema Constraint: ProductVariantStock requires a non-null variantId[cite: 133].
          // This means products without variants likely need a 'default' variant record in the DB
          // for stock tracking purposes, even if not explicitly shown to the user.
          if (!item.variantId) {
            // If your system allows selling base products without explicit variants, you need a mechanism
            // to find the corresponding ProductVariantStock record (e.g., querying by productId and a known 'default' variant indicator).
            // For now, based on schema[cite: 133], we assume a variantId is *always* required for stock operations.
            console.error(
              `Missing variantId for product ${item.productId}. Stock lookup requires a variantId as per schema.`
            );
            throw new Error(
              `Configuration Error: Cannot process product ${product.name} without a specific variantId for stock tracking.`
            );
          }
          const stockLookupVariantId = item.variantId; // Use the validated, non-null variantId for lookups

          // --- 3b. Find Available Stock Batch ---
          // Attempt to find a suitable stock batch based on inventory policy (FIFO/FEFO).
          // This lookup is necessary even if stock tracking is disabled, because SaleItem requires stockBatchId[cite: 65].
          const availableBatch = await tx.stockBatch.findFirst({
            where: {
              organizationId,
              locationId, // Filter by the specific POS location [cite: 123]
              productId: item.productId,
              variantId: stockLookupVariantId, // Use the explicit variantId for lookup [cite: 121]
              // Only consider batches with quantity if tracking is enabled OR if we need to fulfill the requirement
              currentQuantity: { gte: enableStockTracking ? item.quantity : 1 }, // Check if batch has enough quantity if tracking[cite: 128], or just exists if not tracking
            },
            // orderBy: {
            //   // Select ordering based on inventory policy
            //   ...(inventoryPolicy === 'FEFO' && { expiryDate: 'asc' }), // FEFO: oldest expiry date first [cite: 128]
            //   receivedDate: 'asc', // FIFO or FEFO fallback: oldest received date first [cite: 128]
            // },
            select: { id: true, purchasePrice: true }, // Select only needed fields [cite: 128]
          });

          if (availableBatch) {
            // If a suitable batch is found
            selectedStockBatchId = availableBatch.id;
            unitCost = new Prisma.Decimal(availableBatch.purchasePrice); // Use cost from the selected batch [cite: 66, 128]
          } else {
            // No single batch has enough quantity (or exists if not tracking quantity).
            // Check total stock at location only if tracking is enabled and negative stock is disallowed.
            const totalStock =
              enableStockTracking && !allowNegativeStock
                ? await tx.productVariantStock.findUnique({
                    where: {
                      variantId_locationId: { variantId: stockLookupVariantId, locationId: locationId }, // [cite: 134]
                      organizationId,
                    },
                    select: { currentStock: true }, // [cite: 133]
                  })
                : null;
            const currentStockCount = totalStock?.currentStock ?? 0;

            if (enableStockTracking && !allowNegativeStock) {
              // If tracking is on AND negative stock is forbidden, throw error.
              console.error(
                `Insufficient stock: Prod=${item.productId}, Var=${stockLookupVariantId}, Loc=${locationId}. Required: ${item.quantity}, Available: ${currentStockCount}. Negative stock disabled.`
              );
              throw new Error(
                `Insufficient stock for ${product.name} ${variant ? `(${variant.name})` : ''}. Required: ${item.quantity}, Available: ${currentStockCount} at location ${locationId}.`
              );
            } else {
              // CASE 1: Stock Tracking Disabled OR Negative Stock Allowed
              // We still need a batch ID for SaleItem [cite: 65] and a cost basis[cite: 66].
              // Find the *most recent* batch (even if empty) to use its ID and cost.
              const lastBatchForCost = await tx.stockBatch.findFirst({
                where: {
                  organizationId,
                  locationId,
                  productId: item.productId,
                  variantId: stockLookupVariantId,
                },
                orderBy: { receivedDate: 'desc' }, // Get the most recent batch for cost reference
                select: { id: true, purchasePrice: true }, // Select only needed fields [cite: 128]
              });

              if (!lastBatchForCost) {
                // If absolutely NO batch exists for this product/variant/location ever, we cannot satisfy SaleItem.stockBatchId[cite: 65].
                console.error(
                  `No batch found for costing/linking: Prod=${item.productId}, Var=${stockLookupVariantId}, Loc=${locationId}. Cannot create SaleItem.`
                );
                throw new Error(
                  `System Error: Cannot record sale for ${product.name} ${variant ? `(${variant.name})` : ''}. No purchase batch found at location ${locationId} to determine cost or link to.`
                );
              }

              // Use the last found batch's ID and cost.
              selectedStockBatchId = lastBatchForCost.id;
              unitCost = new Prisma.Decimal(lastBatchForCost.purchasePrice); // [cite: 66, 128]

              if (enableStockTracking && allowNegativeStock) {
                // Log warning only if we are actually proceeding with negative stock.
                console.warn(
                  `Proceeding with negative stock for Prod=${item.productId}, Var=${stockLookupVariantId}, Loc=${locationId}. Required: ${item.quantity}. Using cost/ID from last batch: ${selectedStockBatchId}`
                );
              } else {
                // Log info if stock tracking is just disabled.
                console.info(
                  `Stock tracking disabled. Linking sale item to last known batch: Prod=${item.productId}, Var=${stockLookupVariantId}, Loc=${locationId}, Batch: ${selectedStockBatchId}`
                );
              }
            }
          }

          // At this point, selectedStockBatchId should be non-null, or an error thrown.
          if (!selectedStockBatchId) {
            // Safeguard check - should not be reached if logic above is sound.
            console.error(
              `Critical error: selectedStockBatchId is null despite checks. Prod=${item.productId}, Var=${stockLookupVariantId}`
            );
            throw new Error(`Internal error processing item ${product.name}. Could not determine stock batch.`);
          }

          // Add item's contribution to the overall transaction subtotal.
          transactionSubTotal = transactionSubTotal.add(itemTotal);

          // Prepare data for SaleItem creation.
          saleItemsCreateData.push({
            productId: product.id,
            variantId: variant?.id, // Use the actual variant ID [cite: 64]
            stockBatchId: selectedStockBatchId, // Link to the specific batch used [cite: 65] - MUST be non-null
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(unitPrice), // Price per unit at time of sale [cite: 66]
            unitCost: unitCost, // Cost per unit from StockBatch at time of sale [cite: 66]
            discountAmount: new Prisma.Decimal(0), // Placeholder for potential item-level discount logic
            taxRate: new Prisma.Decimal(taxRate), // Apply org default tax rate [cite: 66] (can be item-specific later)
            taxAmount: new Prisma.Decimal(0), // Calculated later if needed per item
            totalAmount: itemTotal, // (unitPrice * quantity) before overall sale discount/tax [cite: 66]
          });

          // --- 3c. Aggregate Stock Updates (In Memory, IF Tracking Enabled) ---
          // Only aggregate updates if stock tracking is enabled for this sale.
          if (enableStockTracking) {
            // Aggregate decrement for the specific StockBatch quantity.
            const currentBatchUpdate = stockBatchUpdates.get(selectedStockBatchId) ?? 0;
            stockBatchUpdates.set(selectedStockBatchId, currentBatchUpdate - item.quantity);

            // Find the corresponding ProductVariantStock record ID for aggregation.
            const variantStockRecord = await tx.productVariantStock.findUnique({
              where: {
                variantId_locationId: { variantId: stockLookupVariantId, locationId: locationId }, // [cite: 134]
                organizationId,
              },
              select: { id: true },
            });

            if (!variantStockRecord) {
              // This case implies data inconsistency if a StockBatch exists but ProductVariantStock doesn't.
              // However, it's necessary if negative stock is allowed and this is the first sale bringing stock < 0.
              console.warn(
                `Consistency Warning: StockBatch ${selectedStockBatchId} link required, but no corresponding ProductVariantStock found for Var=${stockLookupVariantId}, Loc=${locationId}. Trying to create one for negative stock.`
              );
              // Attempt to create the missing ProductVariantStock record, starting with the negative quantity.
              const newVariantStock = await createMissingVariantStock(
                tx,
                product.id, // [cite: 132]
                organizationId,
                stockLookupVariantId, // The non-null variant ID [cite: 133]
                locationId, // [cite: 133]
                -item.quantity // Start with the negative quantity from this sale [cite: 133]
              );
              // Track update for the newly created record.
              variantStockUpdates.set(stockLookupVariantId + '_' + locationId, {
                id: newVariantStock.id,
                change: -item.quantity,
              });
            } else {
              // Aggregate update for the existing ProductVariantStock record.
              const key = stockLookupVariantId + '_' + locationId;
              const currentVariantStockUpdate = variantStockUpdates.get(key)?.change ?? 0;
              variantStockUpdates.set(key, {
                id: variantStockRecord.id,
                change: currentVariantStockUpdate - item.quantity,
              });
            }
          } // End if (enableStockTracking)
        } // --- End Item Loop ---

        // --- 3d. Calculate Final Sale Amounts ---
        const saleSubTotal = transactionSubTotal;
        const saleDiscount = new Prisma.Decimal(discountAmount); // Convert input number to Decimal

        // Validate that the overall discount doesn't exceed the subtotal.
        if (saleDiscount.greaterThan(saleSubTotal)) {
          console.error(`Validation Error: Discount (${saleDiscount}) exceeds subtotal (${saleSubTotal}).`);
          throw new Error(
            `Overall discount (${saleDiscount.toFixed(2)}) cannot exceed subtotal (${saleSubTotal.toFixed(2)}).`
          );
        }

        // Calculate taxable amount after discount.
        const taxableAmount = saleSubTotal.sub(saleDiscount);
        // Calculate tax amount using Decimal precision and appropriate rounding.
        const calculatedTaxAmount = taxableAmount.mul(taxRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        // Calculate the final amount the customer pays.
        const finalAmount = taxableAmount.add(calculatedTaxAmount); // [cite: 59]

        console.log(
          `Sale Calculation: SubTotal=${saleSubTotal}, Discount=${saleDiscount}, Taxable=${taxableAmount}, TaxRate=${taxRate}, TaxAmount=${calculatedTaxAmount}, Final=${finalAmount}`
        );

        // --- 3e. Create Sale Record ---
        // Generate a unique sale number (consider a more robust method like DB sequence in production).
        const saleNumber = `SALE-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`; // Example generator [cite: 58]
        console.log(`Creating Sale record: ${saleNumber}`);

        const sale = await tx.sale.create({
          data: {
            saleNumber: saleNumber, // [cite: 58]
            organizationId: organizationId, // [cite: 21]
            memberId: memberId, // Member processing the sale [cite: 58]
            customerId: customerId, // Optional customer [cite: 58]
            cashDrawerId: cashDrawerId, // Optional cash drawer [cite: 60]
            locationId: locationId, // Record the location of the sale [cite: 59] (ensure schema has this)
            saleDate: new Date(), // [cite: 58]
            totalAmount: saleSubTotal, // Sum of item totals BEFORE overall discount/tax [cite: 58]
            discountAmount: saleDiscount, // Overall sale discount [cite: 59]
            taxAmount: calculatedTaxAmount, // Calculated tax for the whole sale [cite: 59]
            finalAmount: finalAmount, // Final amount charged [cite: 59]
            paymentMethod: paymentMethod, // [cite: 59]
            paymentStatus: PaymentStatus.COMPLETED, // Assume payment is immediate and successful [cite: 59]
            notes: notes ?? `POS Sale at location ${locationId} on ${new Date().toLocaleString()}`, // [cite: 60]
            // Create SaleItems linked to this sale using the prepared data array.
            items: {
              createMany: {
                data: saleItemsCreateData,
                skipDuplicates: false, // Should not have duplicates here
              },
            },
          },
          // Include relations needed for the return value, receipt generation, and cache revalidation.
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, category: { select: { name: true } } } }, // Include necessary product fields
                variant: { select: { id: true, name: true, sku: true } }, // Include necessary variant fields [cite: 41]
              },
            },
            customer: true, // [cite: 58]
            member: { select: { id: true, user: { select: { name: true } } } }, // Get member and user's name [cite: 11]
            organization: { select: { id: true, name: true, logo: true } }, // [cite: 17]
            location: { select: { id: true, name: true } }, // Include location details [cite: 59]
          },
        });
        console.log(`Sale record ${sale.id} created successfully.`);

        // --- 3f. Apply Aggregated Stock Updates (Conditional) ---
        // Only apply the collected stock updates if tracking is enabled.
        if (enableStockTracking) {
          console.log('Stock tracking enabled, applying updates...');

          // Update Stock Batches using the aggregated map.
          console.log(`Applying Stock Batch updates:`, stockBatchUpdates);
          for (const [batchId, quantityChange] of stockBatchUpdates.entries()) {
            if (quantityChange < 0) {
              // Only apply decrements for sales
              await tx.stockBatch.update({
                where: { id: batchId },
                data: {
                  currentQuantity: {
                    decrement: Math.abs(quantityChange), // Use decrement for atomicity [cite: 128]
                  },
                },
              });
            }
          }

          // Update Product Variant Stock (overall stock count per location) using the aggregated map.
          console.log(`Applying Product Variant Stock updates:`, variantStockUpdates);
          // Note: variantStockUpdates keys are "variantId_locationId"
          for (const [_key, update] of variantStockUpdates.entries()) {
            console.log(`Applying Product Variant Stock update:`, _key, update);
            // Use _key as key is reconstructed
            if (update.change < 0) {
              // Only apply decrements for sales
              await tx.productVariantStock.update({
                where: { id: update.id }, // Use the stored ProductVariantStock ID
                data: {
                  currentStock: {
                    // Update total stock [cite: 133]
                    decrement: Math.abs(update.change),
                  },
                  // IMPORTANT: Also update availableStock if your logic uses it separately[cite: 133].
                  // This depends on whether you implement a 'reservedStock' workflow.
                  // availableStock: { decrement: Math.abs(update.change) }
                },
              });
            }
          }
          console.log(`Stock levels updated successfully.`);
        } else {
          console.log('Stock tracking disabled, skipping stock level updates.');
        }

        // --- 3g. Update Customer Loyalty Points (Example) ---
        // Award loyalty points if a customer is associated and the sale amount is positive.
        if (customerId && finalAmount.greaterThan(0)) {
          // Example rule: 1 point per $10 spent (adjust as needed).
          // Use Decimal division and floor for accuracy.
          const pointsEarned = finalAmount.dividedBy(10).floor().toNumber();

          if (pointsEarned > 0) {
            console.log(`Awarding ${pointsEarned} loyalty points to customer ${customerId} for sale ${sale.id}`);
            // Update customer points atomically within the transaction.
            const updatedCustomer = await tx.customer.update({
              where: { id: customerId, organizationId }, // Ensure customer belongs to the org
              data: {
                loyaltyPoints: { increment: pointsEarned }, // [cite: 54]
              },
              select: { loyaltyPoints: true }, // Select only needed field
            });

            // Create a record of the loyalty transaction for history/auditing.
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
            console.log(
              `Awarded ${pointsEarned} points to customer ${customerId}. New balance: ${updatedCustomer.loyaltyPoints}`
            );
          }
        }

        // --- 3h. Transaction Success ---
        // If all steps within the transaction callback succeed, Prisma commits the transaction.
        console.log(`Transaction completed successfully for Sale ID: ${sale.id}`);
        // Return the created sale object with included details.
        // Cast to the specific type including relations for type safety downstream.
        return sale as SaleWithDetails;
      }, // End transaction callback
      {
        // Prisma transaction options (adjust timeouts as needed)
        maxWait: 15000, // Max time Prisma waits to acquire a DB connection (ms)
        timeout: 30000, // Max time the *entire transaction* can run (ms)
      }
    ); // --- End Database Transaction ---

    // --- 4. Post-Transaction: Generate Receipt ---
    // Receipt generation happens *after* the transaction commits successfully.
    // It's considered a best-effort operation; failure here shouldn't roll back the sale.
    let receiptUrl: string | null = null;
    if (result) {
      // Ensure the transaction returned the sale object
      try {
        console.log(`Attempting receipt generation for Sale ID: ${result.id}`);
        // Pass the necessary data (the result object from the transaction) to the generation function.
        // The `SaleWithDetails` type ensures all required relations (like member name) are present.
        receiptUrl = await generateAndSaveReceiptPdf(result); // Pass the SaleWithDetails object [cite: 62]

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
        // Log receipt errors but don't fail the overall process.
        console.error(`Receipt generation/upload failed critically for Sale ID ${result.id}:`, {
          errorMessage: receiptError instanceof Error ? receiptError.message : 'Unknown receipt error',
          errorDetails: receiptError,
        });
        // Optionally: Implement alerting (e.g., send to error monitoring service)
      }
    } else {
      // This case should theoretically not happen if the transaction succeeded without error,
      // but it's a defensive check.
      console.error('Transaction seemed successful but returned no result object.');
      throw new Error('Transaction completed without returning expected sale data.');
    }

    // --- 5. Cache Revalidation ---
    // Invalidate caches for pages potentially affected by this sale.
    // (Assumes Next.js `revalidatePath` or similar mechanism)
    console.log('Revalidating relevant paths...');
    try {
      revalidatePath('/dashboard/pos'); // General POS dashboard
      revalidatePath('/dashboard/sales'); // Sales list
      revalidatePath(`/dashboard/sales/${result.id}`); // Specific sale detail page
      // Revalidate product/variant stock pages only if tracking was enabled
      if (enableStockTracking) {
        cartItems.forEach(item => {
          revalidatePath(`/dashboard/inventory/products/${item.productId}`); // Product stock page
          if (item.variantId) {
            // Assuming a specific path for variant stock details exists
            revalidatePath(`/dashboard/inventory/variants/${item.variantId}`);
          }
        });
      }
      if (customerId) {
        revalidatePath(`/dashboard/customers/${customerId}`); // Customer detail page (for loyalty points)
      }
      console.log('Path revalidation triggers issued.');
    } catch (revalidationError) {
      console.error('Cache revalidation failed:', revalidationError);
      // Log but don't fail the overall success response
    }

    // --- 6. Success Response ---
    // Return a success indicator, message, and the relevant data.
    return {
      success: true,
      message: `Sale ${result.saleNumber} processed successfully.`,
      saleId: result.id,
      data: result, // Include the full sale object (SaleWithDetails)
      receiptUrl: receiptUrl, // Include the generated receipt URL
    };
  } catch (error: unknown) {
    // --- 7. Comprehensive Error Handling ---
    // Catch any error that occurred during validation, transaction, or post-transaction steps.
    console.error('--- POS Sale Processing CRITICAL ERROR ---');
    console.error(`Timestamp: ${new Date().toISOString()}`);
    // Use || 'N/A' for context variables that might not be set if error occurred early
    console.error(
      `Organization: ${organizationId || 'N/A'}, Member: ${memberId || 'N/A'}, Location: ${locationId || 'N/A'}`
    );
    console.error(`Input Data (validated if available):`, validation.success ? validatedData : inputData);
    console.error('Error Details:', error);
    console.error('--- End Error Report ---');

    // Attempt to create an audit log entry for the failure.
    try {
      // Ensure context variables have fallback values for logging if they weren't set.
      const logMemberId = memberId || 'system'; // Fallback if memberId not set
      const logOrgId = organizationId || 'unknown'; // Fallback if orgId not set

      await createAuditLog(db, {
        memberId: logMemberId,
        organizationId: logOrgId,
        action: AuditLogAction.CREATE, // Log as a failed CREATE attempt
        entityType: AuditEntityType.SALE, // [cite: 170]
        entityId: 'N/A', // No sale ID was successfully created
        description: `Failed to process sale. Error: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          input: validation.success ? validatedData : inputData, // Include input that caused failure
        }, // [cite: 175]
      });
    } catch (auditLogError) {
      console.error('Failed to write failure audit log:', auditLogError);
    }

    // Determine user-friendly error message and details based on error type.
    let errorMessage = 'Failed to process sale due to an internal error.';
    let errorDetails: string | object | undefined;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Specific known database errors (constraints, etc.)
      errorMessage = `Database error processing sale. Please try again or contact support. (Code: ${error.code})`;
      errorDetails = { code: error.code, meta: error.meta, message: error.message };
      if (error.code === 'P2002') {
        // Unique constraint failed - provide more specific feedback if possible
        errorMessage = `Error: A record with a conflicting unique identifier (e.g., sale number) already exists.`;
      }
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      // Data shape error before DB operation
      errorMessage = 'Data validation failed during database operation. Check input format.';
      errorDetails = error.message;
    } else if (error instanceof z.ZodError) {
      // Should be caught by initial validation, but as a fallback
      errorMessage = 'Invalid input data format detected during processing.';
      errorDetails = error.flatten().fieldErrors;
    } else if (error instanceof Error) {
      // Catch specific errors thrown within the transaction (like stock/validation) or other logic errors.
      // Provide specific messages for known operational failures.
      if (
        error.message.includes('Insufficient stock') ||
        error.message.includes('not found') || // Covers product/variant/batch not found
        error.message.includes('cannot exceed subtotal') || // Discount error
        error.message.includes('requires a variantId') || // Configuration error
        error.message.includes('price not set') || // Missing price error
        error.message.includes('Could not determine stock batch') // Internal logic safeguard
      ) {
        errorMessage = error.message; // Use the specific, user-friendly error thrown in the logic
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
      error: errorDetails ?? 'No further details available.', // Internal/debugging details
    };
  }
}

/**
 * Helper function to create a ProductVariantStock record if one is missing,
 * typically used when processing a sale that results in negative stock
 * for a variant/location combination that didn't previously exist.
 * Executed within the main transaction context (`tx`).
 *
 * @param tx - The Prisma TransactionClient.
 * @param productId - The ID of the product. [cite: 132]
 * @param organizationId - The ID of the organization.
 * @param variantId - The ID of the product variant (must be non-null). [cite: 133]
 * @param locationId - The ID of the inventory location. [cite: 133]
 * @param initialQuantity - The starting quantity (usually negative from the sale item). [cite: 133]
 * @returns Promise<ProductVariantStock> - The newly created stock record.
 * @throws Error if creation fails.
 */
async function createMissingVariantStock(
  tx: Prisma.TransactionClient, // Use Prisma.TransactionClient type for transaction context
  productId: string,
  organizationId: string,
  variantId: string, // Schema requires variantId to be non-null [cite: 133]
  locationId: string,
  initialQuantity: number
): Promise<ProductVariantStock> {
  console.log(
    `Attempting to create missing ProductVariantStock: Org=${organizationId}, Prod=${productId}, Var=${variantId}, Loc=${locationId}, InitialQty=${initialQuantity}`
  );

  try {
    // Create the ProductVariantStock record using the transaction client.
    const newVariantStock = await tx.productVariantStock.create({
      data: {
        organizationId: organizationId,
        productId: productId, // [cite: 132]
        variantId: variantId, // Use the provided non-null variantId [cite: 133]
        locationId: locationId, // [cite: 133]
        currentStock: initialQuantity, // [cite: 133]
        // availableStock will likely be calculated based on currentStock - reservedStock (default 0)
        // Set defaults explicitly if needed, though Prisma might handle them.
        reservedStock: 0, // [cite: 133]
        availableStock: initialQuantity, // [cite: 133] Initial available = current if reserved is 0
        // Default reorder points can be inherited or set here if necessary [cite: 134]
      },
    });

    console.log(`Successfully created new ProductVariantStock record with ID: ${newVariantStock.id}`);
    return newVariantStock;
  } catch (error: unknown) {
    console.error(
      `Failed to create missing ProductVariantStock: Org=${organizationId}, Var=${variantId}, Loc=${locationId}`,
      error
    );
    // Re-throw a more specific error to be caught by the main transaction handler.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Handle potential race condition if another process created it simultaneously
      throw new Error(
        `Concurrency Error: Failed to create missing stock record for Variant ${variantId} at Location ${locationId} as it likely already exists now.`
      );
    } else if (error instanceof Error) {
      throw new Error(`Failed to create missing stock record: ${error.message}`);
    }
    throw new Error('An unknown error occurred while creating the missing stock record.');
  }
}
