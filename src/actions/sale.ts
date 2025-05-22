import { PaymentMethod, Prisma } from '@/prisma/client';
import { z } from 'zod';
import { getServerAuthContext } from './auth';
import { revalidatePath } from 'next/cache';
import { AuditLogAction, AuditEntityType, LoyaltyReason, PaymentStatus, ProductVariantStock } from '@/prisma/client';
import { createAuditLog } from '@/lib/audits/logger';
import { db } from '@/lib/db';

const ProcessSaleInputSchema = z.object({
  cartItems: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional().nullable(), // Variant might be optional depending on product setup
      quantity: z.number().int().positive(),
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

type SaleWithDetails = Prisma.SaleGetPayload<{
  include: {
    items: {
      include: {
        // Use variant relation to get product details for consistency
        variant: {
          select: {
            id: true;
            name: true;
            sku: true;
            product: { select: { id: true; name: true; category: { select: { name: true } } } }; // Get product info via variant
          };
        };
        // Removed direct product relation as variant includes it
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
    }
  | {
      success: false;
      message: string;
      error?: string | object; // More specific error type
    };

export async function processSale(inputData: unknown): Promise<ProcessSaleResult> {
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

  try {
    const authContext = await getServerAuthContext();
    if (!authContext?.memberId || !authContext?.organizationId) {
      throw new Error('User authentication context (memberId, organizationId) not found.');
    }
    memberId = authContext.memberId;
    organizationId = authContext.organizationId;
  } catch (authError: unknown) {
    console.error('Authentication context retrieval failed:', authError);
    return {
      success: false,
      message: 'Failed to retrieve user authentication context.',
      error: authError instanceof Error ? authError.message : 'Unknown auth error',
    };
  }

  try {
    const orgSettings = await db.organizationSettings.findUnique({
      where: { organizationId },
      select: {
        defaultTaxRate: true, // [cite: 181]
        negativeStock: true, // [cite: 182]
        inventoryPolicy: true, // [cite: 182]
      },
    });

    // Determine tax rate and negative stock allowance from settings, providing defaults.
    const taxRate = orgSettings?.defaultTaxRate ?? new Prisma.Decimal(0); // Use Decimal, default to 0 [cite: 181]
    const allowNegativeStock = orgSettings?.negativeStock ?? false; // [cite: 182]
    const inventoryPolicy = orgSettings?.inventoryPolicy ?? 'FEFO'; // [cite: 182] Default to FEFO

    // Start the Prisma transaction
    const result = await db.$transaction(
      async tx => {
        let transactionSubTotal = new Prisma.Decimal(0); // Sum of (unitPrice * quantity) for all items, before sale discount/tax
        const saleItemsCreateData: Omit<Prisma.SaleItemCreateManySaleInput, 'saleId'>[] = [];

        // Maps for stock updates *only if* enableStockTracking is true
        const stockBatchUpdates: Map<string, number> = new Map();
        const variantStockUpdates: Map<string, { id: string; change: number }> = new Map();

        // --- 3a. Item Processing Loop ---
        for (const item of cartItems) {
          // Fetch the product and its specific variant (if applicable)
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

          if (!product) {
            throw new Error(
              `Product ID ${item.productId} not found, is inactive, or does not belong to organization ${organizationId}.`
            );
          }

          const variant = product.variants?.[0];
          // Variant is required for stock tracking and price lookup in this logic
          if (!item.variantId || !variant) {
            console.error(
              `Missing or inactive variantId for product ${item.productId}. Price and stock lookup require an active variantId.`
            );
            throw new Error(
              `Configuration Error: Cannot process product ${product.name}. An active variant selection is required.`
            );
          }
          const stockLookupVariantId = item.variantId; // Use the validated, non-null variant ID

          const unitPrice = variant.retailPrice; // [cite: 41]
          if (unitPrice === undefined || unitPrice === null) {
            console.error(`Price missing for Product ${item.productId}, Variant ${item.variantId}`);
            throw new Error(`Retail price not set for ${product.name} (${variant.name}).`);
          }
          const itemTotal = new Prisma.Decimal(unitPrice).mul(item.quantity);
          const itemTaxAmount = itemTotal.mul(taxRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
          const itemTotalWithTax = itemTotal.add(itemTaxAmount);

          // --- 3b. Stock Batch Handling (Conditional) ---
          let unitCost = new Prisma.Decimal(0); // Default cost if tracking disabled or no batch found
          let selectedStockBatchId: string | null = null; // Initialize as null [cite: 64]

          if (enableStockTracking) {
            console.log(`Stock tracking enabled for item ${variant.name}. Looking up batch...`);
            // Use FEFO by default, fallback to FIFO/LIFO if needed or based on inventoryPolicy
            const batchOrderBy: Prisma.StockBatchOrderByWithRelationInput[] = [];
            if (inventoryPolicy === 'FEFO') {
              batchOrderBy.push({ expiryDate: 'asc' }, { receivedDate: 'asc' }); // Prioritize earliest expiry, then earliest received
            } else if (inventoryPolicy === 'LIFO') {
              batchOrderBy.push({ receivedDate: 'desc' }); // Prioritize latest received
            } else {
              // FIFO (Default or Explicit)
              batchOrderBy.push({ receivedDate: 'asc' }); // Prioritize earliest received
            }

            const availableBatch = await tx.stockBatch.findFirst({
              where: {
                organizationId,
                locationId, // Filter by the specific POS location [cite: 123]
                variantId: stockLookupVariantId,
                currentQuantity: { gte: item.quantity },
                // Optionally filter out expired batches if FEFO and expiryDate is set
                ...(inventoryPolicy === 'FEFO' && { expiryDate: { gte: new Date() } }),
              },
              orderBy: batchOrderBy,
              select: { id: true, purchasePrice: true }, // [cite: 128]
            });

            if (availableBatch) {
              // If a suitable batch is found
              selectedStockBatchId = availableBatch.id;
              unitCost = new Prisma.Decimal(availableBatch.purchasePrice); // [cite: 66, 128]
              console.log(`Found suitable batch ${selectedStockBatchId} with cost ${unitCost}`);
            } else {
              // No single batch has enough quantity OR all are expired (if FEFO)
              // Check total stock if negative stock is disallowed
              const totalStock = !allowNegativeStock
                ? await tx.productVariantStock.findUnique({
                    where: {
                      variantId_locationId: { variantId: stockLookupVariantId, locationId: locationId }, // [cite: 133]
                      organizationId,
                    },
                    select: { currentStock: true }, // [cite: 132]
                  })
                : null;
              const currentStockCount = totalStock?.currentStock ?? 0;

              if (!allowNegativeStock && currentStockCount < item.quantity) {
                console.error(
                  `Insufficient stock: Prod=${item.productId}, Var=${stockLookupVariantId}, Loc=${locationId}. Required: ${item.quantity}, Available: ${currentStockCount}. Negative stock disabled.`
                );
                throw new Error(
                  `Insufficient stock for ${product.name} (${variant.name}). Required: ${item.quantity}, Available: ${currentStockCount} at location ${locationId}.`
                );
              } else {
                // Need *a* batch for costing/linking, even if allowing negative stock or no specific batch found
                const lastBatchForCost = await tx.stockBatch.findFirst({
                  where: {
                    organizationId,
                    locationId,
                    variantId: stockLookupVariantId,
                  },
                  orderBy: { receivedDate: 'desc' }, // Get the most recent batch for cost reference
                  select: { id: true, purchasePrice: true }, // [cite: 128]
                });

                if (!lastBatchForCost) {
                  // If absolutely NO batch exists for this product/variant/location ever.
                  console.error(
                    `No batch found for costing/linking: Prod=${item.productId}, Var=${stockLookupVariantId}, Loc=${locationId}. Cannot create SaleItem without a batch reference.`
                  );
                  // SaleItem.stockBatchId is non-nullable in the provided schema text, so we must error here if tracking is enabled.
                  // If it were nullable, we could proceed with null. Re-check schema.txt...
                  // CONFIRMED: saleItem.stockBatchId is optional (String?)[cite: 64]. Let's throw if tracking enabled but no historical batch exists.
                  throw new Error(
                    `System Error: Cannot record sale for ${product.name} (${variant.name}) with stock tracking enabled. No purchase batch history found at location ${locationId} to determine cost or link to.`
                  );
                }

                selectedStockBatchId = lastBatchForCost.id; // Link to the most recent batch
                unitCost = new Prisma.Decimal(lastBatchForCost.purchasePrice); // [cite: 66, 128]

                if (allowNegativeStock) {
                  console.warn(
                    `Proceeding with negative stock (or selling from unavailable batch) for Prod=${item.productId}, Var=${stockLookupVariantId}, Loc=${locationId}. Required: ${item.quantity}. Using cost/ID from last batch: ${selectedStockBatchId}`
                  );
                }
              }
            }
            // This check is now only relevant if tracking is enabled
            if (!selectedStockBatchId) {
              console.error(
                `Critical error: selectedStockBatchId is null despite checks AND stock tracking enabled. Prod=${item.productId}, Var=${stockLookupVariantId}`
              );
              throw new Error(
                `Internal error processing item ${product.name}. Could not determine stock batch while tracking enabled.`
              );
            }
          } else {
            // Stock tracking is DISABLED for this sale
            console.info(
              `Stock tracking disabled. Skipping stock batch lookup for item: Prod=${item.productId}, Var=${stockLookupVariantId}. Using default cost.`
            );
            selectedStockBatchId = null; // Explicitly set to null [cite: 64]
            // unitCost remains the default (0) - could alternatively use ProductVariant.buyingPrice if available/desired
            // unitCost = variant.buyingPrice ? new Prisma.Decimal(variant.buyingPrice) : new Prisma.Decimal(0);
          }

          // --- 3c. Prepare Sale Item Data ---
          transactionSubTotal = transactionSubTotal.add(itemTotal);
          const sellingUnit = await tx.productVariant.findUnique({
            where:{id:product.variants[0].id }
          })

          saleItemsCreateData.push({
            variantId: stockLookupVariantId, // Use the non-null variant ID
            stockBatchId: selectedStockBatchId, // Can be null if tracking disabled [cite: 64]
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(unitPrice),
            unitCost: unitCost, // Use derived cost (if tracking) or default (if not tracking)
            discountAmount: new Prisma.Decimal(0), // Item-level discount (can be added later)
            taxRate: new Prisma.Decimal(taxRate), // Assuming sale-level tax rate applies to all items
            taxAmount: itemTaxAmount, // Calculated tax amount for this item
            totalAmount: itemTotalWithTax, // Total including tax
            sellingUnitId: sellingUnit?.sellingUnitId
          });

          // --- 3d. Aggregate Stock Updates (In Memory, IF Tracking Enabled) ---
          if (enableStockTracking && selectedStockBatchId) {
            // Ensure we have a batch ID to update
            // Aggregate update for the specific StockBatch
            const currentBatchUpdate = stockBatchUpdates.get(selectedStockBatchId) ?? 0;
            stockBatchUpdates.set(selectedStockBatchId, currentBatchUpdate - item.quantity);

            // Find or potentially create the ProductVariantStock record for aggregation
            const variantStockRecord = await tx.productVariantStock.findUnique({
              where: {
                variantId_locationId: { variantId: stockLookupVariantId, locationId: locationId }, // [cite: 133]
                organizationId,
              },
              select: { id: true },
            });

            let variantStockId: string;
            if (!variantStockRecord) {
              // This case should ideally not happen if a StockBatch exists, but handle defensively
              console.warn(
                `Consistency Warning: StockBatch ${selectedStockBatchId} exists, but no corresponding ProductVariantStock found for Var=${stockLookupVariantId}, Loc=${locationId}. Creating one.`
              );
              // Attempt to create the missing ProductVariantStock record
              const newVariantStock = await createMissingVariantStock(
                tx,
                product.id, // [cite: 131]
                organizationId,
                stockLookupVariantId, // [cite: 133]
                locationId, // [cite: 133]
                -item.quantity // Start with the negative quantity from this sale [cite: 132]
              );
              variantStockId = newVariantStock.id;
              // Set initial change directly for the new record
              variantStockUpdates.set(stockLookupVariantId + '_' + locationId, {
                id: variantStockId,
                change: -item.quantity,
              });
            } else {
              variantStockId = variantStockRecord.id;
              // Aggregate update for the existing ProductVariantStock record.
              const key = stockLookupVariantId + '_' + locationId;
              const currentVariantStockUpdate = variantStockUpdates.get(key)?.change ?? 0;
              variantStockUpdates.set(key, {
                id: variantStockId,
                change: currentVariantStockUpdate - item.quantity,
              });
            }
          }
        } // --- End Item Processing Loop ---

        // --- 3e. Calculate Sale Totals ---
        const saleSubTotal = transactionSubTotal;
        const saleDiscount = new Prisma.Decimal(discountAmount); // Convert input number to Decimal

        if (saleDiscount.greaterThan(saleSubTotal)) {
          console.error(`Validation Error: Discount (${saleDiscount}) exceeds subtotal (${saleSubTotal}).`);
          throw new Error(
            `Overall discount (${saleDiscount.toFixed(2)}) cannot exceed subtotal (${saleSubTotal.toFixed(2)}).`
          );
        }

        const taxableAmount = saleSubTotal.sub(saleDiscount);
        const calculatedTaxAmount = taxableAmount.mul(taxRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const finalAmount = taxableAmount.add(calculatedTaxAmount); // [cite: 59]

        console.log(
          `Sale Calculation: SubTotal=${saleSubTotal}, Discount=${saleDiscount}, Taxable=${taxableAmount}, TaxRate=${taxRate}, TaxAmount=${calculatedTaxAmount}, Final=${finalAmount}`
        );

        // --- 3f. Create Sale Record ---
        const saleNumber = `SALE-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`; // [cite: 58]
        console.log(`Creating Sale record: ${saleNumber}`);

        const sale = await tx.sale.create({
          data: {
            saleNumber: saleNumber, // [cite: 58]
            organizationId: organizationId, // [cite: 21]
            memberId: memberId, // [cite: 58]
            customerId: customerId, // [cite: 58]
            cashDrawerId: cashDrawerId, // [cite: 60]
            locationId: locationId, // [cite: 59]
            saleDate: new Date(), // [cite: 58]
            totalAmount: saleSubTotal, // Pre-discount/tax total [cite: 58]
            discountAmount: saleDiscount, // Overall discount [cite: 59]
            taxAmount: calculatedTaxAmount, // Overall tax [cite: 59]
            finalAmount: finalAmount, // Final charged amount [cite: 59]
            paymentMethod: paymentMethod, // [cite: 59]
            paymentStatus: PaymentStatus.COMPLETED, // Assume immediate success [cite: 59]
            notes: notes ?? `POS Sale at location ${locationId}`, // [cite: 60]
            items: {
              createMany: {
                data: saleItemsCreateData,
                skipDuplicates: false,
              },
            },
          },
          // Include relations needed for the return value and receipt
          include: {
            items: {
              include: {
                variant: {
                  // Fetch variant details for receipt/response
                  select: {
                    id: true,
                    name: true,
                    sku: true,
                    product: { select: { id: true, name: true, category: { select: { name: true } } } }, // Include product name/category via variant [cite: 38, 41]
                  },
                },
              },
            },
            customer: true, // [cite: 57]
            member: { select: { id: true, user: { select: { name: true } } } }, // [cite: 11]
            organization: { select: { id: true, name: true, logo: true } }, // [cite: 17]
            location: { select: { id: true, name: true } }, // [cite: 59]
          },
        });
        console.log(`Sale record ${sale.id} created successfully.`);

        // --- 3g. Apply Aggregated Stock Updates (Conditional) ---
        if (enableStockTracking) {
          console.log('Stock tracking enabled, applying updates...');

          // Update Stock Batches
          console.log(`Applying Stock Batch updates:`, stockBatchUpdates);
          for (const [batchId, quantityChange] of stockBatchUpdates.entries()) {
            if (quantityChange < 0) {
              // Should always be negative for sales
              await tx.stockBatch.update({
                where: { id: batchId },
                data: {
                  currentQuantity: {
                    decrement: Math.abs(quantityChange), // [cite: 128]
                  },
                },
              });
            }
          }

          // Update Product Variant Stock (overall count)
          console.log(`Applying Product Variant Stock updates:`, variantStockUpdates);
          for (const [_key, update] of variantStockUpdates.entries()) {
            console.log(`Updating ProductVariantStock ID ${update.id} with change ${update.change} for variant ${_key}`);
            if (update.change < 0) {
              // Should always be negative for sales
              await tx.productVariantStock.update({
                where: { id: update.id }, // Use the stored ID
                data: {
                  currentStock: {
                    // [cite: 132]
                    decrement: Math.abs(update.change),
                  },
                  // Assuming availableStock = currentStock - reservedStock (no separate reservation step here)
                  // If availableStock is tracked separately, decrement it too.
                  // availableStock: { decrement: Math.abs(update.change) } // [cite: 132]
                },
              });
            }
          }
          console.log(`Stock levels updated successfully.`);
        } else {
          console.log('Stock tracking disabled, skipping stock level updates.');
        }

        // --- 3h. Update Customer Loyalty Points ---
        if (customerId && finalAmount.greaterThan(0)) {
          // Example: 1 point per $10
          const pointsEarned = finalAmount.dividedBy(10).floor().toNumber();
          if (pointsEarned > 0) {
            console.log(`Awarding ${pointsEarned} loyalty points to customer ${customerId} for sale ${sale.id}`);
            const updatedCustomer = await tx.customer.update({
              where: { id: customerId, organizationId },
              data: { loyaltyPoints: { increment: pointsEarned } }, // [cite: 54]
              select: { loyaltyPoints: true },
            });
            await tx.loyaltyTransaction.create({
              data: {
                organizationId: organizationId,
                customerId: customerId, // [cite: 227]
                memberId: memberId, // [cite: 228]
                pointsChange: pointsEarned,
                reason: LoyaltyReason.SALE_EARNED, // [cite: 231]
                relatedSaleId: sale.id, // [cite: 228]
                transactionDate: new Date(), // [cite: 230]
              },
            });
            console.log(
              `Awarded ${pointsEarned} points to customer ${customerId}. New balance: ${updatedCustomer.loyaltyPoints}`
            );
          }
        }

        // Cast to the detailed type before returning
        return sale as SaleWithDetails;
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    ); // --- End Database Transaction ---


    // --- 4. Cache Revalidation ---
    console.log('Revalidating relevant paths...');
    try {
      revalidatePath('/pos');
      revalidatePath('/sales');
      revalidatePath(`/sales/${result.id}`);
      // Only revalidate inventory paths if tracking was enabled
      if (enableStockTracking) {
        cartItems.forEach(item => {
          if (item.variantId) {
            // Check if variantId exists
            revalidatePath(`/inventory/products/${item.productId}`); // Product stock page
            revalidatePath(`/inventory/variants/${item.variantId}`); // Variant stock page
          }
        });
      }
      if (customerId) {
        revalidatePath(`/customers/${customerId}`); // For loyalty points
      }
      console.log('Path revalidation triggers issued.');
    } catch (revalidationError) {
      console.error('Cache revalidation failed:', revalidationError);
      // Log but don't fail the overall success response
    }

    // --- 6. Success Response ---
    return {
      success: true,
      message: `Sale ${result.saleNumber} processed successfully.`,
      saleId: result.id,
      data: result, // Return the full SaleWithDetails object
      // receiptUrl: receiptUrl,
    };
  } catch (error: unknown) {
    // --- 7. Comprehensive Error Handling ---
    // (Keep the existing comprehensive error handling block)
    console.error('--- POS Sale Processing CRITICAL ERROR ---');
    console.error(`Timestamp: ${new Date().toISOString()}`);
    console.error(
      `Context: Org=${organizationId || 'N/A'}, Member=${memberId || 'N/A'}, Location=${locationId || 'N/A'}, StockTracking=${enableStockTracking}`
    );
    console.error(`Input Data:`, validation.success ? validatedData : inputData);
    console.error('Error Details:', error);
    console.error('--- End Error Report ---');

    // Optional: Audit log for failure attempt
    try {
      await createAuditLog(db, {
        memberId: memberId || 'system',
        organizationId: organizationId || 'unknown',
        action: AuditLogAction.CREATE,
        entityType: AuditEntityType.SALE, // [cite: 170]
        entityId: 'N/A', // Sale failed
        description: `Failed to process POS sale. Error: ${error instanceof Error ? error.message : String(error)}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
          input: validation.success ? validatedData : inputData,
        }, // [cite: 172]
      });
    } catch (auditLogError) {
      console.error('Failed to write failure audit log:', auditLogError);
    }

    let errorMessage = 'Failed to process sale due to an internal error.';
    let errorDetails: string | object | undefined;

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      errorMessage = `Database error processing sale. (Code: ${error.code})`;
      errorDetails = { code: error.code, meta: error.meta, message: error.message };
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      errorMessage = 'Data validation failed during database operation.';
      errorDetails = error.message;
    } else if (error instanceof z.ZodError) {
      errorMessage = 'Invalid input data format detected.';
      errorDetails = error.flatten().fieldErrors;
    } else if (error instanceof Error) {
      // Use specific user-friendly messages for common logical errors
      if (
        error.message.includes('Insufficient stock') ||
        error.message.includes('not found') ||
        error.message.includes('cannot exceed subtotal') ||
        error.message.includes('Configuration Error:') ||
        error.message.includes('price not set') ||
        error.message.includes('Could not determine stock batch') ||
        error.message.includes('System Error:')
      ) {
        errorMessage = error.message;
      } else {
        errorMessage = 'An unexpected error occurred during sale processing.';
      }
      errorDetails = { message: error.message, stack: error.stack }; // Keep stack trace for debugging
    } else {
      errorMessage = 'An unknown error occurred.';
      errorDetails = String(error);
    }

    return {
      success: false,
      message: errorMessage,
      error: errorDetails ?? 'No further details available.',
    };
  }
}

// Helper function remains the same
async function createMissingVariantStock(
  tx: Prisma.TransactionClient,
  productId: string,
  organizationId: string,
  variantId: string, // Schema requires variantId to be non-null [cite: 133]
  locationId: string,
  initialQuantity: number // Can be negative if starting due to a sale
): Promise<ProductVariantStock> {
  console.log(
    `Attempting to create missing ProductVariantStock: Org=${organizationId}, Prod=${productId}, Var=${variantId}, Loc=${locationId}, InitialQty=${initialQuantity}`
  );
  // Ensure initialQuantity results in non-negative availableStock if reservedStock is 0
  const currentStock = initialQuantity;
  const availableStock = currentStock; // Assuming reservedStock starts at 0 [cite: 132]

  try {
    const newVariantStock = await tx.productVariantStock.create({
      data: {
        organizationId: organizationId,
        productId: productId, // [cite: 131]
        variantId: variantId, // [cite: 133]
        locationId: locationId, // [cite: 133]
        currentStock: currentStock, // [cite: 132]
        availableStock: availableStock, // [cite: 132]
        reservedStock: 0, // Default reserved stock [cite: 132]
        // reorderPoint/reorderQty can use defaults or be fetched from variant/org settings
      },
    });
    console.log(`Created new ProductVariantStock record ${newVariantStock.id}`);
    return newVariantStock;
  } catch (creationError) {
    console.error('Failed to create missing ProductVariantStock:', creationError);
    // Depending on the error type, you might want to throw a more specific error.
    // If it's a unique constraint violation (P2002), it might mean another process created it concurrently.
    if (creationError instanceof Prisma.PrismaClientKnownRequestError && creationError.code === 'P2002') {
      console.warn(
        `ProductVariantStock for Var=${variantId}, Loc=${locationId} likely created concurrently. Attempting to fetch.`
      );
      // Attempt to fetch the record again, assuming it now exists.
      const existingRecord = await tx.productVariantStock.findUnique({
        where: { variantId_locationId: { variantId, locationId }, organizationId },
      });
      if (existingRecord) return existingRecord;
      // If fetch fails again, throw the original error or a new one.
      throw new Error(
        `Failed to create or find ProductVariantStock for Var=${variantId}, Loc=${locationId} after concurrent creation attempt.`
      );
    }
    // Re-throw other errors
    throw creationError;
  }
}
