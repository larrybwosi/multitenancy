import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Get product with all the necessary relationships
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          include: {
            variantStocks: {
              include: {
                location: true,
              }
            },
            suppliers: {
              include: {
                supplier: true,
              }
            }
          }
        },
        defaultLocation: true,
        variantStock: {
          include: {
            location: true,
          }
        },
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Get all inventory locations for dropdown lists
    const locations = await prisma.inventoryLocation.findMany({
      where: {
        organizationId: product.organizationId,
        isActive: true
      }
    });

    // Get all suppliers for the dropdown list
    const suppliers = await prisma.supplier.findMany({
      where: {
        organizationId: product.organizationId,
        isActive: true
      }
    });

    return NextResponse.json({
      product,
      locations,
      suppliers
    }, {
      status: 200
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    return NextResponse.json(
      { error: "Failed to fetch product details", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 