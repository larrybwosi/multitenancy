import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerAuthContext } from "@/actions/auth";
import {
  createInventoryLocationSchema,
} from "@/lib/validations/warehouse";
import { z } from "zod";
import { LocationType, MeasurementUnit } from "@prisma/client";

// Response schema for a single warehouse
const warehouseResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  locationType: z.nativeEnum(LocationType),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  capacityTracking: z.boolean(),
  totalCapacity: z.number().optional(),
  capacityUnit: z.nativeEnum(MeasurementUnit).optional(),
  capacityUsed: z.number().optional(),
  address: z.string().optional(),
  managerId: z.string().optional(),
  managerName: z.string().optional(),
  productCount: z.number(),
  stockValue: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Response schema for multiple warehouses
const warehousesResponseSchema = z.object({
  warehouses: z.array(warehouseResponseSchema),
});

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
            product: { select: { id: true } },
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
        location.stockBatches.map((batch) => batch.product.id)
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

    return NextResponse.json(warehousesResponseSchema.parse({ warehouses }));
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
    const parsedData = createInventoryLocationSchema.parse(data);

    // Create new warehouse
    const newLocation = await prisma.inventoryLocation.create({
      data: {
        name: parsedData.name,
        description: parsedData.description,
        locationType: parsedData.locationType,
        address: parsedData.address,
        isActive: parsedData.isActive,
        isDefault: parsedData.isDefault,
        capacityTracking: parsedData.capacityTracking,
        totalCapacity: parsedData.totalCapacity,
        capacityUnit: parsedData.capacityUnit,
        managerId: parsedData.managerId,
        organizationId,
        // Include any new fields from the updated schema
        parentLocationId: parsedData.parentLocationId,
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

    // Transform to response schema
    const response = warehouseResponseSchema.parse({
      id: newLocation.id,
      name: newLocation.name,
      description: newLocation.description,
      locationType: newLocation.locationType,
      isActive: newLocation.isActive,
      isDefault: newLocation.isDefault,
      capacityTracking: newLocation.capacityTracking,
      totalCapacity: newLocation.totalCapacity,
      capacityUnit: newLocation.capacityUnit,
      address: newLocation.address,
      managerId: newLocation.managerId,
      managerName: newLocation.manager?.user.name,
      productCount: 0,
      stockValue: 0,
      createdAt: newLocation.createdAt.toISOString(),
      updatedAt: newLocation.updatedAt.toISOString(),
    });

    return NextResponse.json(response);
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
