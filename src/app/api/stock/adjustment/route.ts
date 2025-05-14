import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import {  Prisma, StockAdjustmentReason } from '@/prisma/client'; // Added Member, Product, ProductVariant
import { getServerAuthContext } from '@/actions/auth'; // For fetching authenticated member

interface AdjustmentRequestBody {
  productId: string; // Kept for validating variant, but not directly stored on StockAdjustment
  variantId: string; // This is the key link for StockAdjustment
  stockBatchId?: string;
  // userId: string; // Replaced with memberId from auth context
  quantity: number;
  reason: StockAdjustmentReason;
  notes?: string;
  adjustmentDate?: string;
  locationId: string; // Added: locationId is required for StockAdjustment
}

export async function POST(request: NextRequest) {
  // Renamed for clarity
  const { organizationId, memberId: authenticatedMemberId } = await getServerAuthContext(); // Get orgId and memberId

  if (!organizationId || !authenticatedMemberId) {
    return NextResponse.json(
      { error: 'Authentication required or organization/member not identified.' },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as AdjustmentRequestBody;

    // --- Validation ---
    if (
      !body.productId || // Used to validate variant
      !body.variantId ||
      !body.locationId || // Added validation for locationId
      body.quantity === 0 ||
      !body.reason
    ) {
      return NextResponse.json(
        {
          error: 'Missing required fields (productId, variantId, locationId, quantity, reason)',
        },
        { status: 400 }
      );
    }
    if (!Object.values(StockAdjustmentReason).includes(body.reason)) {
      return NextResponse.json({ error: 'Invalid adjustment reason' }, { status: 400 });
    }
    if (!Number.isInteger(body.quantity)) {
      return NextResponse.json({ error: 'Quantity must be an integer' }, { status: 400 });
    }

    const adjustment = await prisma.$transaction(async tx => {
      // 1. Validate ProductVariant exists and belongs to the product and organization
      const productVariant = await tx.productVariant.findUnique({
        where: { id: body.variantId, productId: body.productId, product: { organizationId } },
        include: { product: true }, // Include product to verify organizationId
      });

      if (!productVariant) {
        throw new Error(`Variant ${body.variantId} not found for product ${body.productId} in this organization.`);
      }
      // Validate location
      const locationExists = await tx.inventoryLocation.findUnique({
        where: { id: body.locationId, organizationId },
      });
      if (!locationExists) {
        throw new Error(`InventoryLocation ${body.locationId} not found in this organization.`);
      }

      // 2. Handle Stock Update (if stockBatchId is provided)
      if (body.stockBatchId) {
        const targetBatch = await tx.stockBatch.findUnique({
          where: { id: body.stockBatchId, organizationId }, // Ensure batch belongs to the org
          // No need to include variant.product here, productVariant already validated
        });

        if (!targetBatch) {
          throw new Error(`Stock Batch ${body.stockBatchId} not found.`);
        }
        // Validate batch matches product/variant
        if (targetBatch.variantId !== body.variantId) {
          // Corrected: StockBatch links to variantId
          throw new Error(`Stock Batch ${body.stockBatchId} does not match the specified variant ${body.variantId}.`);
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
        // Logic for adjustments without a specific batch ID
        // This part remains complex and depends on business rules.
        // For simplicity, if no batch ID, we're recording an adjustment without directly altering a specific batch's quantity here.
        // The overall stock in ProductVariantStock should be updated separately if not using batches.
        // For now, decrementing adjustments without a batch ID are disallowed.
        const allowedReasonsWithoutBatch = [
          StockAdjustmentReason.INITIAL_STOCK,
          StockAdjustmentReason.FOUND,
          // Add other reasons if applicable
        ];
        if (body.quantity < 0 && !allowedReasonsWithoutBatch.includes(body.reason) && !body.stockBatchId) {
          throw new Error(`Decrementing adjustments (${body.reason}) require specifying a stockBatchId.`);
        }
        console.warn(
          `Stock adjustment for variant ${body.variantId} created without a specific batch ID. Ensure ProductVariantStock is updated accordingly if not batch-managed.`
        );
      }

      // 3. Create the Adjustment Record
      const newAdjustment = await tx.stockAdjustment.create({
        data: {
          variantId: body.variantId, // Corrected: Use variantId
          stockBatchId: body.stockBatchId,
          locationId: body.locationId, // Added: locationId
          memberId: authenticatedMemberId, // Corrected: Use memberId from auth
          quantity: body.quantity,
          reason: body.reason,
          notes: body.notes,
          adjustmentDate: body.adjustmentDate ? new Date(body.adjustmentDate) : new Date(),
          organizationId, // Add organizationId
        },
      });

      // Optionally, update ProductVariantStock here if not managing by batches or if it's an aggregate
      // This depends on how your inventory is structured (batch-level vs variant-location-level)
      // Example:
      // const variantStock = await tx.productVariantStock.findUnique({
      //   where: { variantId_locationId: { variantId: body.variantId, locationId: body.locationId } }
      // });
      // if (variantStock) {
      //   await tx.productVariantStock.update({
      //     where: { variantId_locationId: { variantId: body.variantId, locationId: body.locationId } },
      //     data: { currentStock: { increment: body.quantity } } // Adjust total stock
      //   });
      // } else if (body.quantity > 0) { // If creating new stock entry
      //   await tx.productVariantStock.create({
      //       data: {
      //           productId: productVariant.productId,
      //           variantId: body.variantId,
      //           locationId: body.locationId,
      //           currentStock: body.quantity,
      //           organizationId,
      //           // reorderPoint, reorderQty would need defaults or inputs
      //       }
      //   });
      // }

      return newAdjustment;
    });

    return NextResponse.json(adjustment, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create stock adjustment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    const statusCode =
      errorMessage.includes('negative stock') ||
      errorMessage.includes('not found') ||
      errorMessage.includes('does not match') ||
      errorMessage.includes('require specifying')
        ? 400
        : 500;
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}


export async function GET(request: NextRequest) {
  // Renamed for clarity
  const { organizationId, memberId: authenticatedMemberId } = await getServerAuthContext(); // Get orgId

  if (!organizationId) {
    // Depending on your rules, you might allow listing without orgId if it's for a super admin
    // For now, let's assume organizationId is required.
    return NextResponse.json({ error: 'Organization not identified.' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl; // Correctly using request.nextUrl
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  // Filtering
  const productIdFilter = searchParams.get('productId'); // Will be used to find variantIds
  const variantIdFilter = searchParams.get('variantId');
  const memberIdFilter = searchParams.get('memberId'); // Corrected from userId
  const reasonFilter = searchParams.get('reason') as StockAdjustmentReason | null;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const where: Prisma.StockAdjustmentWhereInput = { organizationId }; // Always filter by org

  if (variantIdFilter) {
    where.variantId = variantIdFilter;
  } else if (productIdFilter) {
    // If productId is provided, find all its variants and filter by them
    const variantsOfProduct = await prisma.productVariant.findMany({
      where: { productId: productIdFilter, product: { organizationId } }, // Ensure variant belongs to the org's product
      select: { id: true },
    });
    if (variantsOfProduct.length > 0) {
      where.variantId = { in: variantsOfProduct.map(v => v.id) };
    } else {
      // Product has no variants or product not found, so no adjustments will match
      return NextResponse.json({
        data: [],
        pagination: { currentPage: page, totalPages: 0, totalItems: 0, itemsPerPage: limit },
      });
    }
  }

  if (memberIdFilter) {
    // Corrected from userId
    where.memberId = memberIdFilter;
  }
  if (reasonFilter && Object.values(StockAdjustmentReason).includes(reasonFilter)) {
    where.reason = reasonFilter;
  }

  if (startDate || endDate) {
    where.adjustmentDate = {};
    if (startDate) where.adjustmentDate.gte = new Date(startDate);
    if (endDate) where.adjustmentDate.lte = new Date(endDate);
  }

  try {
    const totalCount = await prisma.stockAdjustment.count({ where });

    const adjustments = await prisma.stockAdjustment.findMany({
      where,
      include: {
        variant: {
          // StockAdjustment.variantId links to ProductVariant
          select: {
            name: true,
            sku: true,
            product: {
              // ProductVariant.productId links to Product
              select: {
                name: true, // Product name
                sku: true, // Product SKU
              },
            },
          },
        },
        member: {
          // StockAdjustment.memberId links to Member
          select: {
            // id: true, // Member ID
            user: {
              // Member.userId links to User
              select: {
                name: true, // User's name
                email: true, // User's email
              },
            },
          },
        },
        stockBatch: {
          // StockAdjustment.stockBatchId links to StockBatch
          select: {
            batchNumber: true,
            // Removed costPrice as it's purchasePrice in schema
          },
        },
        location: {
          // StockAdjustment.locationId links to InventoryLocation
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ adjustmentDate: 'desc' }],
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
    console.error('Failed to fetch stock adjustments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
