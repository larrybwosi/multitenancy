import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { ProductSupplierSchema } from "@/lib/validations/product";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate the data
    const validationResult = ProductSupplierSchema.safeParse(body);
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

    // Check if the variant exists
    const variant = await prisma.productVariant.findUnique({
      where: { id: body.productId },
      include: { product: true }
    });

    if (!variant) {
      return NextResponse.json(
        { error: "Product variant not found" },
        { status: 404 }
      );
    }

    // Create the product supplier in the database
    const productSupplier = await prisma.productSupplier.create({
      data: {
        productId: body.productId,
        supplierId: validatedData.supplierId,
        supplierSku: validatedData.supplierSku,
        costPrice: validatedData.costPrice,
        minimumOrderQuantity: validatedData.minimumOrderQuantity,
        packagingUnit: validatedData.packagingUnit,
        isPreferred: validatedData.isPreferred,
      },
      include: {
        supplier: true
      }
    });

    return NextResponse.json({
      success: true,
      data: productSupplier
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating product supplier:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to create product supplier" 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Product Supplier ID is required" },
        { status: 400 }
      );
    }

    // Validate the data
    const validationResult = ProductSupplierSchema.safeParse(body);
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

    // Check if the product supplier exists
    const existingSupplier = await prisma.productSupplier.findUnique({
      where: { id: body.id }
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Product supplier not found" },
        { status: 404 }
      );
    }

    // Update the product supplier in the database
    const updatedSupplier = await prisma.productSupplier.update({
      where: { id: body.id },
      data: {
        supplierId: validatedData.supplierId,
        supplierSku: validatedData.supplierSku,
        costPrice: validatedData.costPrice,
        minimumOrderQuantity: validatedData.minimumOrderQuantity,
        packagingUnit: validatedData.packagingUnit,
        isPreferred: validatedData.isPreferred,
      },
      include: {
        supplier: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedSupplier
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating product supplier:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to update product supplier" 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Parse the URL to get the ID
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Product Supplier ID is required" },
        { status: 400 }
      );
    }

    // Check if the product supplier exists
    const existingSupplier = await prisma.productSupplier.findUnique({
      where: { id }
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Product supplier not found" },
        { status: 404 }
      );
    }

    // Delete the product supplier
    const deletedSupplier = await prisma.productSupplier.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      data: deletedSupplier
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product supplier:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to delete product supplier" 
      },
      { status: 500 }
    );
  }
} 