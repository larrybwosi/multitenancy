import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerAuthContext } from "@/actions/auth";
import { editProduct } from "@/actions/product";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { organizationId } = await getServerAuthContext()

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Get product with all the necessary relationships
    const product = await prisma.product.findUnique({
      where: { id, organizationId },
      include: {
        category: true,
        variants: {
          include: {
            variantStocks: {
              include: {
                location: true,
              },
            },
            suppliers: {
              include: {
                supplier: true,
              },
            },
          },
        },
        defaultLocation: true,
        variantStock: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get all inventory locations for dropdown lists
    const locations = await prisma.inventoryLocation.findMany({
      where: {
        organizationId: product.organizationId,
        isActive: true,
      },
    });

    // Get all suppliers for the dropdown list
    const suppliers = await prisma.supplier.findMany({
      where: {
        organizationId: product.organizationId,
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        product,
        locations,
        suppliers,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 

export async function PUT(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { organizationId } = await getServerAuthContext();
    const { id } = await params;
    console.log("Product ID:", id);
    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Verify the product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id, organizationId },
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
    
    // Update the product in the database
    const updatedProduct = await editProduct(formData);
    console.log("Updated Product:", updatedProduct);

    if(updateProduct.error) {
      return NextResponse.json(
        { error: updateProduct.error, fieldErrors: updateProduct.fieldErrors },
        { status: 400 }
      );
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
    const { organizationId } = await getServerAuthContext();
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
      where: { id: productId, organizationId },
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
