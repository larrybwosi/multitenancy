import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// Schema for validating product update fields
const EditProductFormSchema = z.object({
  id: z.string().cuid(), // ID is required for update
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional().nullable(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  buyingPrice: z.coerce.number().min(0, 'Buying price must be non-negative'),
  retailPrice: z.coerce.number().min(0, 'Retail price must be non-negative'),
  wholesalePrice: z.coerce.number().min(0, 'Wholesale price must be non-negative'),
  reorderPoint: z.coerce.number().int().min(0, 'Reorder point must be non-negative'),
  isActive: z.preprocess(val => (val === 'true' ? true : val === 'false' ? false : val), z.boolean()),
  imageUrls: z.array(z.string().url()).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  try {
    const {id: productId } = await params;
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Verify the product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          take: 1 // Get just the first variant
        }
      }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Parse and validate form data
    const formData = await request.formData();
    const formDataObj: Record<string, unknown> = {};
    console.log("Received form data:", formData);

    // Handle form values and arrays specially
    formData.forEach((value, key) => {
      if (key.endsWith('[]')) {
        // Handle array values like imageUrls[]
        const arrayKey = key.slice(0, -2);
        if (!formDataObj[arrayKey]) {
          formDataObj[arrayKey] = [];
        }
        (formDataObj[arrayKey] as unknown[]).push(value);
      } else {
        formDataObj[key] = value;
      }
    });
    
    // Validate the data
    const validationResult = EditProductFormSchema.safeParse(formDataObj);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      console.log("Validation errors:", fieldErrors);
      return NextResponse.json(
        { 
          error: "Validation failed", 
          fieldErrors
        },
        { status: 400 }
      );
    }
    
    const validatedData = validationResult.data;

    // Update the product in the database
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        sku: validatedData.sku,
        barcode: validatedData.barcode,
        categoryId: validatedData.categoryId,
        isActive: validatedData.isActive,
        imageUrls: validatedData.imageUrls,
      },
      include: {
        category: true,
      }
    });

    // If reorderPoint provided and there are variants, update the first variant
    if (validatedData.reorderPoint && existingProduct.variants.length > 0) {
      const variantId = existingProduct.variants[0].id;
      await prisma.productVariant.update({
        where: { id: variantId },
        data: { 
          reorderPoint: validatedData.reorderPoint,
          buyingPrice: validatedData.buyingPrice,
          retailPrice: validatedData.retailPrice,
          wholesalePrice: validatedData.wholesalePrice
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        product: updatedProduct
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to update product" 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  try {
    const {id: productId} = await params;
    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    // Verify the product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Delete the product
    const deletedProduct = await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ 
      success: true, 
      data: deletedProduct 
    }, { status: 200 });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Failed to delete product" 
    }, { status: 500 });
  }
}
