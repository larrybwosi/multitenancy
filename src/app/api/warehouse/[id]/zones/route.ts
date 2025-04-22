import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import { getServerAuthContext } from "@/actions/auth";

// Schema validation for creating a zone
const createZoneSchema = z.object({
  name: z.string().min(2, { message: "Zone name must be at least 2 characters" }),
  description: z.string().optional(),
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
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: warehouseId } = await params;
    if (!warehouseId) {
      return NextResponse.json({ message: "Missing warehouse ID" }, { status: 400 });
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
    const validatedData = createZoneSchema.parse(body);

    // Create the zone
    const newZone = await prisma.storageZone.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        capacity: validatedData.capacity,
        capacityUnit: validatedData.capacityUnit,
        locationId: warehouseId,
        organizationId,
      },
    });

    // Create audit log
    // await createAuditLog({
    //   entityId: newZone.id,
    //   entityType: AuditEntityType.STORAGE_ZONE,
    //   action: AuditLogAction.CREATE,
    //   memberId: member.id,
    //   organizationId,
    //   metadata: { zoneData: newZone },
    // });

    return NextResponse.json(
      { message: "Zone created successfully", zone: newZone },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating zone:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { message: "Failed to create zone" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

  const { organizationId } = await getServerAuthContext();
    const warehouseId = params.id;
    if (!warehouseId) {
      return NextResponse.json({ message: "Warehouse ID is required" }, { status: 400 });
    }


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

    // Get all zones for this warehouse
    const zones = await prisma.storageZone.findMany({
      where: {
        locationId: warehouseId,
        organizationId,
      },
      include: {
        storageUnits: true,
      },
    });

    return NextResponse.json({ zones });
  } catch (error) {
    console.error("Error fetching zones:", error);
    return NextResponse.json(
      { message: "Failed to fetch zones" },
      { status: 500 }
    );
  }
} 