import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductVariantSchema } from "@/lib/validations/product";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    if (!body.productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Verify the product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: body.productId }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

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

    // Create the variant in the database
    const variant = await prisma.productVariant.create({
      data: {
        productId: body.productId,
        name: validatedData.name,
        sku: validatedData.sku || `SKU-${Date.now()}`,
        barcode: validatedData.barcode,
        attributes: validatedData.attributes || {},
        isActive: validatedData.isActive,
        buyingPrice: validatedData.buyingPrice,
        retailPrice: validatedData.retailPrice,
        wholesalePrice: validatedData.wholesalePrice,
        reorderPoint: validatedData.reorderPoint,
        reorderQty: validatedData.reorderQty,
        lowStockAlert: validatedData.lowStockAlert,
      }
    });

    return NextResponse.json({
      success: true,
      data: variant
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating variant:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create variant" 
      },
      { status: 500 }
    );
  }
} 