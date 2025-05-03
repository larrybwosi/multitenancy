import { deleteSupplier, getSupplier, updateSupplier } from "@/actions/supplier";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


// Context contains params for dynamic routes
export async function GET(
  request: NextRequest,
  { params }: { params: { supplierId: string } }
) {
  
  const {supplierId} = await params;
  try {
    const supplier = await getSupplier(supplierId);
    if (!supplier.success) {
      return NextResponse.json(supplier, { status: 404 });
    }
    const supplierDetails = supplier.data;
    return NextResponse.json(supplierDetails);
  } catch (error) {
    console.error(`Failed to get supplier details for ${supplierId}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Add PUT for updating supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: { supplierId: string } }
) {
  // Add Auth checks
  const { supplierId } = await params;
  try {
    const body = (await request.json())

    const updatedSupplier = await updateSupplier({...body, supplierId});
    return NextResponse.json(updatedSupplier);
  } catch (error: unknown) {
    console.error(`Failed to update supplier ${supplierId}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Add DELETE (soft delete recommended)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { supplierId: string } }
) {
  // Add Auth checks
  const supplierId = params.supplierId;
  try {
    // Soft delete: Mark as inactive instead of removing
    const supplier = await deleteSupplier({id: supplierId});

    return NextResponse.json(supplier);
  } catch (error: unknown) {
    console.error(`Failed to delete supplier ${supplierId}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
