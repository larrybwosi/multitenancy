import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { updateWarehouseSchema } from "../types"
import { getServerAuthContext } from "@/actions/auth";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
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
    const location = await prisma.inventoryLocation.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        stockBatches: {
          select: {
            currentQuantity: true,
            initialQuantity: true,
            product: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })

    if (!location) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 })
    }

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

    // Transform to match UI expectations
    return NextResponse.json({
      warehouse: {
        id: location.id,
        name: location.name,
        location: location.description || "Not specified",
        capacity: 10000, // Default value
        used: usedCapacity,
        manager: "Not assigned", // Not in our schema
        status: location.isActive ? "ACTIVE" : "INACTIVE",
        productCount,
        lastUpdated: location.updatedAt.toISOString(),
        description: location.description || "",
        address: "", // Not in our schema
        phone: "", // Not in our schema
        email: "", // Not in our schema
      },
    })
  } catch (error) {
    console.error("Error fetching warehouse:", error)
    return NextResponse.json({ error: "Failed to fetch warehouse" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
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
            product: {
              select: {
                id: true,
              }
            }
          }
        }
      }
    })

    if (!existingLocation) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 })
    }

    const data = await request.json()
    
    // Validate request data using our shared schema
    const parsedData = updateWarehouseSchema.parse(data)

    // Map status to isActive
    let isActive = existingLocation.isActive
    if (parsedData.status) {
      isActive = parsedData.status === "ACTIVE"
    }

    // Update the warehouse
    const updatedLocation = await prisma.inventoryLocation.update({
      where: {
        id,
      },
      data: {
        name: parsedData.name || existingLocation.name,
        description: parsedData.description !== undefined ? 
          parsedData.description : 
          (parsedData.location || existingLocation.description),
        isActive,
      },
    })
    
    // Calculate product count and used capacity from existing data
    const usedCapacity = existingLocation.stockBatches.reduce(
      (sum, batch) => sum + batch.currentQuantity, 
      0
    )
    
    const uniqueProductIds = new Set(
      existingLocation.stockBatches.map(batch => batch.product.id)
    )
    
    const productCount = uniqueProductIds.size

    // Transform to match UI expectations
    return NextResponse.json({
      id: updatedLocation.id,
      name: updatedLocation.name,
      location: updatedLocation.description || "Not specified",
      capacity: parsedData.capacity || 10000,
      used: usedCapacity,
      manager: parsedData.manager || "Not assigned",
      status: updatedLocation.isActive ? "ACTIVE" : "INACTIVE",
      productCount,
      lastUpdated: updatedLocation.updatedAt.toISOString(),
      description: updatedLocation.description || "",
      address: parsedData.address || "",
      phone: parsedData.phone || "",
      email: parsedData.email || "",
    })
  } catch (error) {
    console.error("Error updating warehouse:", error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update warehouse" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
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
    })

    if (!existingLocation) {
      return NextResponse.json({ error: "Warehouse not found" }, { status: 404 })
    }

    // Check if warehouse has associated stock before deleting
    const hasStock = await prisma.stockBatch.findFirst({
      where: {
        locationId: id,
      },
    })

    if (hasStock) {
      return NextResponse.json({ 
        error: "Cannot delete warehouse with existing stock. Please move all items first."
      }, { status: 400 })
    }

    // Delete the warehouse
    await prisma.inventoryLocation.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting warehouse:", error)
    return NextResponse.json({ error: "Failed to delete warehouse" }, { status: 500 })
  }
}
