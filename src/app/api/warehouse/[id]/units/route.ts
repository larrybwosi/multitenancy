import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { StorageUnitType } from "@/prisma/client";
import { z } from "zod";
import { getServerAuthContext } from "@/actions/auth";

// Schema validation for creating a storage unit
const createUnitSchema = z.object({
  name: z.string().min(2, { message: "Unit name must be at least 2 characters" }),
  unitType: z.enum([
    "SHELF", 
    "RACK", 
    "BIN", 
    "DRAWER", 
    "PALLET", 
    "SECTION", 
    "REFRIGERATOR", 
    "FREEZER", 
    "CABINET", 
    "BULK_AREA", 
    "OTHER"
  ]),
  zoneId: z.string().optional(),
  reference: z.string().optional(),
  position: z.string().optional(),
  capacity: z.number().positive().optional(),
  capacityUnit: z.enum([
    "CUBIC_METER", 
    "CUBIC_FEET", 
    "SQUARE_METER", 
    "SQUARE_FEET", 
    "METER", 
    "FEET", 
    "COUNT", 
    "WEIGHT_KG", 
    "WEIGHT_LB"
  ]).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  depth: z.number().positive().optional(),
  dimensionUnit: z.string().optional(),
  maxWeight: z.number().positive().optional(),
  weightUnit: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const {id :warehouseId} = await params;
    if (!warehouseId) {
      return NextResponse.json({ message: "Warehouse ID is required" }, { status: 400 });
    }

  const { organizationId } = await getServerAuthContext();

    // Verify warehouse belongs to organization
    const warehouse = await prisma.inventoryLocation.findFirst({
      where: {
        id: warehouseId,
        organizationId,
      },
    });

    if (!warehouse) {
      return NextResponse.json({ message: "Warehouse not found" }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const validatedData = createUnitSchema.parse(body);

    // If zoneId provided, verify the zone belongs to this warehouse
    if (validatedData.zoneId) {
      const zoneExists = await prisma.storageZone.findFirst({
        where: {
          id: validatedData.zoneId,
          locationId: warehouseId,
          organizationId,
        },
      });

      if (!zoneExists) {
        return NextResponse.json({ message: "Zone not found in this warehouse" }, { status: 404 });
      }
    }

    // Create the storage unit
    const newUnit = await prisma.storageUnit.create({
      data: {
        name: validatedData.name,
        unitType: validatedData.unitType as StorageUnitType,
        locationId: warehouseId,
        zoneId: validatedData.zoneId,
        reference: validatedData.reference,
        position: validatedData.position,
        capacity: validatedData.capacity,
        capacityUnit: validatedData.capacityUnit,
        width: validatedData.width,
        height: validatedData.height,
        depth: validatedData.depth,
        dimensionUnit: validatedData.dimensionUnit,
        maxWeight: validatedData.maxWeight,
        weightUnit: validatedData.weightUnit,
        organizationId,
      },
    });

    // Create audit log
    // await createAuditLog({
    //   entityId: newUnit.id,
    //   entityType: AuditEntityType.STORAGE_UNIT,
    //   action: AuditLogAction.CREATE,
    //   memberId: member.id,
    //   organizationId,
    //   metadata: { unitData: newUnit },
    // });

    return NextResponse.json(
      { message: "Storage unit created successfully", unit: newUnit },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating storage unit:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Failed to create storage unit" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id : warehouseId} = await params;
    if (!warehouseId) {
      return NextResponse.json({ message: "Warehouse ID is required" }, { status: 400 });
    }

  const { organizationId } = await getServerAuthContext();

    // Check query params
    const { searchParams } = request.nextUrl;
    const zoneId = searchParams.get("zoneId");

    // Get storage units with optional filter by zone
    const units = await prisma.storageUnit.findMany({
      where: {
        locationId: warehouseId,
        organizationId,
        ...(zoneId ? { zoneId } : {}),
      },
      include: {
        zone: true,
        positions: true,
      },
    });

    return NextResponse.json({ units });
  } catch (error) {
    console.error("Error fetching storage units:", error);
    return NextResponse.json(
      { message: "Failed to fetch storage units" },
      { status: 500 }
    );
  }
} 