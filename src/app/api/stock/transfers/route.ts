import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { Prisma, StockMovement } from "@prisma/client";

// Define types for API
interface TransferItem {
  productId: string;
  variantId?: string;
  stockBatchId?: string;
  quantity: number;
}

interface CreateTransferData {
  fromLocationId: string;
  toLocationId: string;
  items: TransferItem[];
  notes?: string;
  memberId: string;
  organizationId: string;
}

export async function GET(request: NextRequest) {
  // Get URL parameters
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  const search = searchParams.get("search");
  const sortBy = searchParams.get("sortBy") || "movementDate";
  const sortOrder = (searchParams.get("sortOrder") as "asc") || "desc";

  try {
    // Build the where clause for filtering
    const where: Prisma.StockMovementWhereInput = {
      movementType: "TRANSFER", // Only get transfer movements
    };

    if (locationId) {
      where.OR = [{ fromLocationId: locationId }, { toLocationId: locationId }];
    }

    if (search) {
      where.OR = [
        ...(where.OR || []),
        { id: { contains: search, mode: "insensitive" } },
        { fromLocation: { name: { contains: search, mode: "insensitive" } } },
        { toLocation: { name: { contains: search, mode: "insensitive" } } },
        {
          product: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { sku: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          variant: {
            sku: { contains: search, mode: "insensitive" },
          },
        },
      ];
    }

    // Define the orderBy clause
    const orderBy: Prisma.StockMovementOrderByWithRelationInput = {};

    switch (sortBy) {
      case "date":
      case "movementDate":
        orderBy.movementDate = sortOrder;
        break;
      case "fromLocation":
        orderBy.fromLocation = { name: sortOrder };
        break;
      case "toLocation":
        orderBy.toLocation = { name: sortOrder };
        break;
      default:
        orderBy.movementDate = sortOrder;
    }

    // Fetch transfers from database with related data
    const transfers = await prisma.stockMovement.findMany({
      where,
      include: {
        fromLocation: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        toLocation: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            imageUrls: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        stockBatch: {
          select: {
            id: true,
            batchNumber: true,
          },
        },
        member: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy,
    });

    // Format the response by grouping transfers by referenceId
    const transferGroups: Record<string, Transfer> = {};

    transfers.forEach((transfer) => {
      if (!transfer.referenceId) return;

      if (!transferGroups[transfer.referenceId]) {
        transferGroups[transfer.referenceId] = {
          id: transfer.referenceId,
          movementDate: transfer.movementDate.toISOString(),
          fromLocationId: transfer.fromLocationId,
          fromLocation: transfer.fromLocation?.name,
          toLocationId: transfer.toLocationId,
          toLocation: transfer.toLocation?.name,
          notes: transfer.notes || "",
          memberId: transfer.memberId,
          member: transfer.member?.user.name || "System",
          items: [],
          createdAt: transfer.createdAt.toISOString(),
        };
      }

      transferGroups[transfer.referenceId].items.push({
        productId: transfer.productId,
        productName: transfer.product?.name,
        sku: transfer.variant?.sku || transfer.product?.sku,
        variantId: transfer.variantId,
        variantName: transfer.variant?.name,
        quantity: transfer.quantity,
        stockBatchId: transfer.stockBatchId,
        stockBatchNumber: transfer.stockBatch?.batchNumber,
        image:
          transfer.product?.imageUrls?.[0] ||
          "/placeholder.svg?height=40&width=40",
      });
    });

    const formattedTransfers = Object.values(transferGroups).map(
      (transfer) => ({
        ...transfer,
        totalItems: transfer.items.length,
        totalQuantity: transfer.items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        ),
      })
    );

    return NextResponse.json({
      transfers: formattedTransfers,
      total: formattedTransfers.length,
    });
  } catch (error) {
    console.error("Failed to fetch stock transfers:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as CreateTransferData;

    // Get location details
    const fromLocation = await prisma.inventoryLocation.findUnique({
      where: { id: data.fromLocationId },
      select: { name: true },
    });

    const toLocation = await prisma.inventoryLocation.findUnique({
      where: { id: data.toLocationId },
      select: { name: true },
    });

    if (!fromLocation || !toLocation) {
      return NextResponse.json(
        { success: false, message: "Source or destination location not found" },
        { status: 404 }
      );
    }

    // Verify stock availability before creating the transfer
    for (const item of data.items) {
      if (item.stockBatchId) {
        // Check specific batch stock
        const batch = await prisma.stockBatch.findUnique({
          where: { id: item.stockBatchId },
          select: { currentQuantity: true },
        });

        if (!batch || batch.currentQuantity < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              message: `Insufficient stock in batch ${item.stockBatchId} for product ${item.productId}`,
            },
            { status: 400 }
          );
        }
      } else {
        // Check general variant stock at the location
        const stock = await prisma.productVariantStock.findFirst({
          where: {
            variantId: item.variantId,
            locationId: data.fromLocationId,
          },
          select: { currentStock: true },
        });

        if (!stock || stock.currentStock < item.quantity) {
          return NextResponse.json(
            {
              success: false,
              message: `Insufficient stock at location for product ${item.productId}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Create a reference ID for grouping these movements
    const referenceId = `transfer-${Date.now()}`;

    // Create the transfer movements in a transaction
    const newTransfers = await prisma.$transaction(
      data.items.map((item) =>
        prisma.stockMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId,
            stockBatchId: item.stockBatchId,
            quantity: item.quantity,
            fromLocationId: data.fromLocationId,
            toLocationId: data.toLocationId,
            movementType: "TRANSFER",
            referenceId,
            referenceType: "StockTransfer",
            memberId: data.memberId,
            organizationId: data.organizationId,
            notes: data.notes,
            movementDate: new Date(),
          },
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                imageUrls: true,
              },
            },
            variant: {
              select: {
                name: true,
                sku: true,
              },
            },
            fromLocation: true,
            toLocation: true,
            stockBatch: true,
          },
        })
      )
    );

    // Update stock levels for each item
    await Promise.all(
      data.items.map(async (item) => {
        if (item.stockBatchId) {
          // Update specific batch
          await prisma.stockBatch.update({
            where: { id: item.stockBatchId },
            data: {
              currentQuantity: { decrement: item.quantity },
            },
          });
        }

        // Update variant stock at source location
        await prisma.productVariantStock.updateMany({
          where: {
            variantId: item.variantId,
            locationId: data.fromLocationId,
          },
          data: {
            currentStock: { decrement: item.quantity },
            availableStock: { decrement: item.quantity },
          },
        });

        // Update or create variant stock at destination location
        const existingStock = await prisma.productVariantStock.findFirst({
          where: {
            variantId: item.variantId,
            locationId: data.toLocationId,
          },
        });

        if (existingStock) {
          await prisma.productVariantStock.update({
            where: { id: existingStock.id },
            data: {
              currentStock: { increment: item.quantity },
              availableStock: { increment: item.quantity },
            },
          });
        } else {
          await prisma.productVariantStock.create({
            data: {
              productId: item.productId,
              variantId: item.variantId!,
              locationId: data.toLocationId,
              currentStock: item.quantity,
              availableStock: item.quantity,
              organizationId: data.organizationId,
            },
          });
        }
      })
    );

    if (!newTransfers.length) {
      throw new Error("Failed to create transfer");
    }

    // Format the response
    const formattedTransfer = {
      id: referenceId,
      movementDate: newTransfers[0].movementDate.toISOString(),
      fromLocationId: newTransfers[0].fromLocationId,
      fromLocation: newTransfers[0].fromLocation?.name,
      toLocationId: newTransfers[0].toLocationId,
      toLocation: newTransfers[0].toLocation?.name,
      notes: newTransfers[0].notes,
      memberId: newTransfers[0].memberId,
      createdAt: newTransfers[0].createdAt.toISOString(),
      items: newTransfers.map((transfer) => ({
        productId: transfer.productId,
        productName: transfer.product?.name,
        sku: transfer.variant?.sku || transfer.product?.sku,
        variantId: transfer.variantId,
        variantName: transfer.variant?.name,
        quantity: transfer.quantity,
        stockBatchId: transfer.stockBatchId,
        stockBatchNumber: transfer.stockBatch?.batchNumber,
        image:
          transfer.product?.imageUrls?.[0] ||
          "/placeholder.svg?height=40&width=40",
      })),
      totalItems: newTransfers.length,
      totalQuantity: newTransfers.reduce(
        (sum, transfer) => sum + transfer.quantity,
        0
      ),
    };

    return NextResponse.json({
      success: true,
      transfer: formattedTransfer,
    });
  } catch (error) {
    console.error("Failed to create stock transfer:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { referenceId, action } = data; // Changed from id to referenceId since we're grouping movements

    // Find all movements that belong to this transfer (grouped by referenceId)
    const transferMovements = await prisma.stockMovement.findMany({
      where: { referenceId },
      include: {
        fromLocation: {
          select: {
            id: true,
            name: true,
          },
        },
        toLocation: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        stockBatch: {
          select: {
            id: true,
            batchNumber: true,
            currentQuantity: true,
          },
        },
        member: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!transferMovements.length) {
      return NextResponse.json(
        { success: false, message: "Transfer not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    let updatedMovements: StockMovement[] = [];

    // Update the transfer based on the action using a transaction
    await prisma.$transaction(async (tx) => {
      switch (action) {
        case "cancel":
          // For cancellation, we need to reverse the stock movements
          for (const movement of transferMovements) {
            // Skip if already cancelled
            if (movement.referenceType === "CANCELLED_TRANSFER") continue;

            // Reverse the movement by creating opposite movements
            await tx.stockMovement.create({
              data: {
                productId: movement.productId,
                variantId: movement.variantId,
                stockBatchId: movement.stockBatchId,
                quantity: movement.quantity,
                fromLocationId: movement.toLocationId, // Reverse locations
                toLocationId: movement.fromLocationId,
                movementType: "TRANSFER",
                referenceId: `cancel-${movement.referenceId}`,
                referenceType: "CANCELLED_TRANSFER",
                memberId: data.memberId,
                organizationId: movement.organizationId,
                notes: `Cancellation of transfer ${movement.referenceId}`,
                movementDate: now,
              },
            });

            // Update stock levels - return items to source location
            if (movement.stockBatchId) {
              await tx.stockBatch.update({
                where: { id: movement.stockBatchId },
                data: {
                  currentQuantity: { increment: movement.quantity },
                },
              });
            }

            // Update variant stock at original source location
            await tx.productVariantStock.updateMany({
              where: {
                variantId: movement.variantId,
                locationId: movement.fromLocationId,
              },
              data: {
                currentStock: { increment: movement.quantity },
                availableStock: { increment: movement.quantity },
              },
            });

            // Update variant stock at destination location
            await tx.productVariantStock.updateMany({
              where: {
                variantId: movement.variantId,
                locationId: movement.toLocationId,
              },
              data: {
                currentStock: { decrement: movement.quantity },
                availableStock: { decrement: movement.quantity },
              },
            });
          }
          break;

        // In your schema, transfers are immediate (no pending/in-transit status)
        // So we only support cancellation as an action
        default:
          throw new Error(
            "Invalid action. Only 'cancel' is supported for immediate transfers"
          );
      }

      // Mark the original movements as cancelled by updating their referenceType
      updatedMovements = await Promise.all(
        transferMovements.map((movement) =>
          tx.stockMovement.update({
            where: { id: movement.id },
            data: {
              referenceType: "CANCELLED_TRANSFER",
              notes: movement.notes
                ? `${movement.notes} | Cancelled on ${now.toISOString()}`
                : `Cancelled on ${now.toISOString()}`,
            },
            include: {
              product: true,
              variant: true,
              fromLocation: true,
              toLocation: true,
              member: {
                include: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          })
        )
      );
    });

    if (!updatedMovements.length) {
      throw new Error("Failed to update transfer");
    }

    // Format the response
    const formattedTransfer = {
      id: referenceId,
      movementDate: updatedMovements[0].movementDate.toISOString(),
      status: "cancelled",
      fromLocationId: updatedMovements[0].fromLocationId,
      fromLocation: updatedMovements[0].fromLocation?.name,
      toLocationId: updatedMovements[0].toLocationId,
      toLocation: updatedMovements[0].toLocation?.name,
      notes: updatedMovements[0].notes,
      memberId: updatedMovements[0].memberId,
      member: updatedMovements[0].member?.user.name || "System",
      cancelledAt: now.toISOString(),
      cancelledById: data.memberId,
      cancellationReason: data.cancellationReason || "No reason provided",
      items: updatedMovements.map((movement) => ({
        productId: movement.productId,
        productName: movement.product?.name,
        sku: movement.variant?.sku || movement.product?.sku,
        variantId: movement.variantId,
        variantName: movement.variant?.name,
        quantity: movement.quantity,
        stockBatchId: movement.stockBatchId,
        stockBatchNumber: movement.stockBatch?.batchNumber,
      })),
      totalItems: updatedMovements.length,
      totalQuantity: updatedMovements.reduce(
        (sum, movement) => sum + movement.quantity,
        0
      ),
    };

    return NextResponse.json({
      success: true,
      transfer: formattedTransfer,
    });
  } catch (error) {
    console.error("Failed to update stock transfer:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal Server Error",
      },
      { status: 500 }
    );
  }
}