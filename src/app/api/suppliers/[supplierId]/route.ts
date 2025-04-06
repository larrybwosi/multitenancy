// app/api/suppliers/[supplierId]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  Supplier,
  Purchase,
  PurchaseItem,
  PurchaseStatus,
} from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

interface SupplierDetails extends Supplier {
  lastOrderDate: Date | null;
  totalSpent: string; // Formatted as string
  totalItemsPurchased: number;
  purchaseHistory?: Purchase[]; // Optional: include recent purchases
}

// Context contains params for dynamic routes
export async function GET(
  request: NextRequest,
  { params }: { params: { supplierId: string } }
) {
  // Add Auth checks
  const supplierId = params.supplierId;

  if (!supplierId) {
    return NextResponse.json(
      { error: "Supplier ID is required" },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch Supplier Basic Info
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // 2. Fetch Related Purchases for Calculations
    const purchases = await prisma.purchase.findMany({
      where: { supplierId: supplierId },
      select: {
        orderDate: true,
        paidAmount: true,
        items: {
          select: {
            receivedQuantity: true,
          },
        },
        status: true, // To potentially filter calculations
      },
      orderBy: {
        orderDate: "desc", // Get latest first for lastOrderDate
      },
    });

    // 3. Perform Calculations
    let lastOrderDate: Date | null = null;
    let totalSpent = new Decimal(0);
    let totalItemsPurchased = 0;

    if (purchases.length > 0) {
      lastOrderDate = purchases[0].orderDate; // Latest order date

      purchases.forEach((purchase) => {
        // Only count spending on non-cancelled orders maybe? Your business logic here.
        if (purchase.status !== PurchaseStatus.CANCELLED) {
          totalSpent = totalSpent.add(purchase.paidAmount);
          purchase.items.forEach((item) => {
            totalItemsPurchased += item.receivedQuantity;
          });
        }
      });
    }

    // 4. Combine data for response
    const supplierDetails: SupplierDetails = {
      ...supplier,
      lastOrderDate: lastOrderDate,
      totalSpent: totalSpent.toFixed(2),
      totalItemsPurchased: totalItemsPurchased,
      // Optionally add recent purchases if needed by the frontend
      purchaseHistory: purchases.slice(0, 10), // Example: last 10 orders
    };

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
  const supplierId = params.supplierId;
  try {
    const body = (await request.json()) as Partial<
      Omit<Supplier, "id" | "createdAt" | "updatedAt">
    >;

    const updatedSupplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: body, // Apply updates from request body
    });
    return NextResponse.json(updatedSupplier);
  } catch (error: any) {
    console.error(`Failed to update supplier ${supplierId}:`, error);
    if (error?.code === "P2002" && error?.meta?.target?.includes("name")) {
      return NextResponse.json(
        { error: "Supplier name already exists" },
        { status: 409 }
      );
    }
    if (error?.code === "P2025") {
      // Record to update not found
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }
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
    const updatedSupplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: { isActive: false },
    });

    // Or hard delete (use with caution):
    // await prisma.supplier.delete({ where: { id: supplierId } });

    return NextResponse.json({ message: "Supplier deactivated successfully" });
    // return new NextResponse(null, { status: 204 }); // For hard delete
  } catch (error: any) {
    console.error(`Failed to delete supplier ${supplierId}:`, error);
    if (error?.code === "P2025") {
      // Record to delete not found
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }
    // Handle potential relation constraint errors if hard deleting (e.g., P2003)
    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          error: "Cannot delete supplier with existing purchases or products.",
        },
        { status: 409 }
      ); // Conflict
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
