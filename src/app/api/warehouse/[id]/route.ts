import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerAuthContext } from "@/actions/auth";
import { updateInventoryLocationSchema } from "@/lib/validations/warehouse";

type Params = Promise<{ id: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params; // Removed await since params is not a promise
    const { userId, organizationId } = await getServerAuthContext();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No active organization' }, { status: 400 });
    }

    // Get warehouse with comprehensive data including zones, storage units, and manager
    const location = await prisma.inventoryLocation.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        manager: true,
        zones: {
          include: {
            storageUnits: true,
          },
        },

        // Include direct storage units (not in zones)
        storageUnits: {
          include: {
            stockBatches: {
              include: {
                variant: {
                  include: {
                    product: true, // Include product directly here
                  },
                },
              },
            },
          },
        },

        // Include stock batches with product information
        stockBatches: {
          include: {
            variant: {
              include: {
                product: true, // Include product with variant
              },
            },
            storageUnit: true,
            position: true,
          },
        },

        // Include variant stocks
        variantStocks: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!location) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    // Calculate total capacity used from stock batches
    const usedCapacity = location.stockBatches.reduce((sum, batch) => sum + batch.currentQuantity, 0);

    // Calculate unique products count
    const uniqueProductIds = new Set([...location.variantStocks.map(stock => stock.productId)]);

    // Process storage units to add usage statistics
    const storageUnits = location.storageUnits.map(unit => {
      // Calculate capacity used based on associated stock batches
      const capacityUsed = unit.stockBatches.reduce((sum, batch) => sum + batch.currentQuantity, 0);

      // Count unique products in this unit
      const uniqueProductsInUnit = new Set(unit.stockBatches.map(batch => batch.variant.productId));

      return {
        ...unit,
        capacityUsed,
        productCount: uniqueProductsInUnit.size,
      };
    });

    // Calculate total stock value
    const stockValue = location.stockBatches.reduce(
      (sum, batch) => sum + batch.currentQuantity * Number(batch.purchasePrice),
      0
    );

    // Transform to match UI expectations
    return NextResponse.json({
      warehouse: {
        ...location,
        used: usedCapacity,
        productCount: uniqueProductIds.size,
        storageUnits,
        stockValue,
        stockItems: location.stockBatches.map(batch => ({
          id: batch.id,
          productId: batch.variant.productId,
          productName: batch.variant.product.name, // Now product is properly included
          quantity: batch.currentQuantity,
          value: batch.currentQuantity * Number(batch.purchasePrice),
          location: batch.storageUnit
            ? {
                unitId: batch.storageUnit.id,
                unitName: batch.storageUnit.name,
                position: batch.position?.identifier || 'Unspecified',
              }
            : null,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return NextResponse.json({ error: 'Failed to fetch warehouse' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;

    const { userId, organizationId } = await getServerAuthContext();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 400 }
      );
    }

    // Check if the warehouse exists and belongs to the organization
    const existingLocation = await prisma.inventoryLocation.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        stockBatches: {
          select: {
            currentQuantity: true,
            variant: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      );
    }

    const data = await request.json();

    // Validate request data using our shared schema
    const parsedData = updateInventoryLocationSchema.parse(data);

    // Map status to isActive

    // Update the warehouse
    const updatedLocation = await prisma.inventoryLocation.update({
      where: {
        id,
      },
      data: {
        name: parsedData.name || existingLocation.name,
        description: parsedData.description || existingLocation.description,
        isActive: parsedData.isActive,
      },
    });

    // Calculate product count and used capacity from existing data
    const usedCapacity = existingLocation.stockBatches.reduce(
      (sum, batch) => sum + batch.currentQuantity,
      0
    );

    const uniqueProductIds = new Set(
      existingLocation.stockBatches.map((batch) => batch.variant.id)
    );

    const productCount = uniqueProductIds.size;

    // Transform to match UI expectations
    return NextResponse.json({
      id: updatedLocation.id,
      name: updatedLocation.name,
      location: updatedLocation.description || "Not specified",
      capacity: parsedData.totalCapacity,
      used: usedCapacity,
      manager: "Not assigned",
      status: updatedLocation.isActive ? "ACTIVE" : "INACTIVE",
      productCount,
      lastUpdated: updatedLocation.updatedAt.toISOString(),
      description: updatedLocation.description || "",
      address: parsedData.address || "",
    });
  } catch (error) {
    console.error("Error updating warehouse:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update warehouse" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const { userId, organizationId } = await getServerAuthContext();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "No active organization" },
        { status: 400 }
      );
    }

    // Check if the warehouse exists and belongs to the organization
    const existingLocation = await prisma.inventoryLocation.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingLocation) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      );
    }

    // Check if warehouse has associated stock before deleting
    const hasStock = await prisma.stockBatch.findFirst({
      where: {
        locationId: id,
      },
    });

    if (hasStock) {
      return NextResponse.json(
        {
          error:
            "Cannot delete warehouse with existing stock. Please move all items first.",
        },
        { status: 400 }
      );
    }

    // Delete the warehouse
    await prisma.inventoryLocation.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting warehouse:", error);
    return NextResponse.json(
      { error: "Failed to delete warehouse" },
      { status: 500 }
    );
  }
}
