import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { createWarehouseSchema } from "./types"
import { getServerAuthContext } from "@/actions/auth";

export async function GET() {
  try {
    const {userId, organizationId} = await getServerAuthContext();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!organizationId) {
      return NextResponse.json({ error: "No active organization" }, { status: 400 })
    }

    const locations = await prisma.inventoryLocation.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        name: 'asc',
      },
      include: {
        stockBatches: {
          select: {
            currentQuantity: true,
            initialQuantity: true,
            product: {
              select: {
                id: true,
              }
            }
          }
        }
      }
    })

    // Transform to match UI expectations
    const warehouses = await Promise.all(locations.map(async (location) => {
      // Calculate used capacity - sum of all current quantities
      const usedCapacity = location.stockBatches.reduce(
        (sum, batch) => sum + batch.currentQuantity, 
        0
      )
      
      // Count unique products
      const uniqueProductIds = new Set(
        location.stockBatches.map(batch => batch.product.id)
      )
      
      const productCount = uniqueProductIds.size
      
      return {
        id: location.id,
        name: location.name,
        location: location.description || "Not specified",
        capacity: 10000, // Default value as it's not in our schema
        used: usedCapacity,
        manager: "Not assigned", // Not in our schema
        status: location.isActive ? "ACTIVE" : "INACTIVE",
        productCount,
        lastUpdated: location.updatedAt.toISOString(),
        description: location.description || "",
        address: "", // Not in our schema
        phone: "", // Not in our schema
        email: "", // Not in our schema
      }
    }))

    return NextResponse.json({ warehouses })
  } catch (error) {
    console.error("Error fetching warehouses:", error)
    return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
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

    const data = await request.json()
    
    // Validate request data using our shared schema
    const parsedData = createWarehouseSchema.parse(data)

    // Create new warehouse (InventoryLocation)
    const newLocation = await prisma.inventoryLocation.create({
      data: {
        name: parsedData.name,
        description: parsedData.description || parsedData.location || "", // Use location as description if provided
        isActive: parsedData.status === "ACTIVE", // Map status to isActive
        organization: {
          connect: {
            id: organizationId,
          },
        },
      },
    })

    // Transform to match UI expectations
    return NextResponse.json({
      id: newLocation.id,
      name: newLocation.name,
      location: newLocation.description || "Not specified",
      capacity: parsedData.capacity || 10000,
      used: 0,
      manager: parsedData.manager || "Not assigned",
      status: newLocation.isActive ? "ACTIVE" : "INACTIVE",
      productCount: 0,
      lastUpdated: newLocation.updatedAt.toISOString(),
      description: newLocation.description || "",
      address: parsedData.address || "",
      phone: parsedData.phone || "",
      email: parsedData.email || "",
    })
  } catch (error) {
    console.error("Error creating warehouse:", error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create warehouse" }, { status: 500 })
  }
}
