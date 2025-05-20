import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerAuthContext } from "@/actions/auth";
import {
  createInventoryLocationSchema,
} from "@/lib/validations/warehouse";
import { z } from "zod";
import { revalidatePath } from "next/cache";


export async function GET() {
  try {
    const { organizationId } = await getServerAuthContext();

    const locations = await prisma.inventoryLocation.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
      include: {
        stockBatches: {
          select: {
            currentQuantity: true,
            purchasePrice: true,
            variant: { select: { product: { select: { id: true } } } },
          },
        },
        manager: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    // Transform to match our response schema
    const warehouses = locations.map((location) => {
      // Calculate used capacity and stock value
      const stockData = location.stockBatches.reduce(
        (acc, batch) => {
          acc.quantity += batch.currentQuantity;
          acc.value +=
            batch.currentQuantity * (batch.purchasePrice?.toNumber() || 0);
          return acc;
        },
        { quantity: 0, value: 0 }
      );

      // Count unique products
      const productCount = new Set(
        location.stockBatches.map((batch) => batch.variant.product.id)
      ).size;

      return {
        id: location.id,
        name: location.name,
        description: location.description || undefined,
        locationType: location.locationType,
        isActive: location.isActive,
        isDefault: location.isDefault,
        capacityTracking: location.capacityTracking,
        totalCapacity: location.totalCapacity || undefined,
        capacityUnit: location.capacityUnit || undefined,
        capacityUsed: location.capacityUsed || undefined,
        address: location.address || undefined,
        managerId: location.managerId || undefined,
        managerName: location.manager?.user.name || undefined,
        productCount,
        stockValue: stockData.value,
        createdAt: location.createdAt.toISOString(),
        updatedAt: location.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({warehouses});
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { organizationId } = await getServerAuthContext();
    const data = await request.json();
    

    // Validate request data using the new schema
    const {name,...parsedData} = createInventoryLocationSchema.parse(data);

    // Create new warehouse
    const newLocation = await prisma.inventoryLocation.create({
      data: {
        name,
        description: parsedData.description,
        locationType: parsedData.locationType,
        address: parsedData.address,
        isActive: parsedData.isActive,
        isDefault: parsedData.isDefault,
        capacityTracking: parsedData.capacityTracking,
        totalCapacity: parsedData.totalCapacity,
        capacityUnit: parsedData.capacityUnit,
        managerId: data.memberId,
        organizationId,
        // Include any new fields from the updated schema
        parentLocationId: parsedData.parentLocationId? parsedData.parentLocationId : undefined,
        customFields: JSON.stringify(parsedData.customFields),
      },
      include: {
        manager: {
          select: {
            user: { select: { name: true } },
          },
        },
      },
    });

    revalidatePath("/warehouses");
    // revalidatePath("/warehouses/new");
    revalidatePath(`/warehouses/${newLocation.id}`);
    return NextResponse.json(newLocation);
  } catch (error) {
    console.error("Error creating warehouse:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create warehouse" },
      { status: 500 }
    );
  }
}
