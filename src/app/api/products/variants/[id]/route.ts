import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductVariantSchema } from "@/lib/validations/product";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Variant ID is required" },
        { status: 400 }
      );
    }

    // Verify the variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: true
      }
    });

    if (!existingVariant) {
      return NextResponse.json(
        { error: "Variant not found" },
        { status: 404 }
      );
    }

    // Parse the request body
    const body = await request.json();

    // Validate the data
    const validationResult = ProductVariantSchema.safeParse(body);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return NextResponse.json(
        { 
          error: "Validation failed", 
          fieldErrors
        },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;

    // Update the variant in the database
    const updatedVariant = await prisma.productVariant.update({
      where: { id },
      data: {
        name: validatedData.name,
        sku: validatedData.sku,
        barcode: validatedData.barcode,
        buyingPrice: validatedData.buyingPrice,
        retailPrice: validatedData.retailPrice,
        wholesalePrice: validatedData.wholesalePrice,
        attributes: validatedData.attributes,
        isActive: validatedData.isActive,
        reorderPoint: validatedData.reorderPoint,
        reorderQty: validatedData.reorderQty,
        lowStockAlert: validatedData.lowStockAlert,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedVariant
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating variant:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to update variant" 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "Variant ID is required" }, { status: 400 });
    }

    // Verify the variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id }
    });

    if (!existingVariant) {
      return NextResponse.json(
        { error: "Variant not found" },
        { status: 404 }
      );
    }

    // Delete the variant
    const deletedVariant = await prisma.productVariant.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      data: deletedVariant 
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting variant:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to delete variant" 
    }, { status: 500 });
  }
} 