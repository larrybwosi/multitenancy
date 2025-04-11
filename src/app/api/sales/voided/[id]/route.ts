import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// DELETE - Permanently delete a voided sale
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // First verify the sale is actually voided
    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (sale.paymentStatus !== "CANCELLED") {
      return NextResponse.json(
        { error: "Only voided sales can be deleted" },
        { status: 400 }
      );
    }

    // Delete the sale permanently
    await prisma.sale.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Voided sale deleted permanently" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting voided sale:", error);
    return NextResponse.json(
      { error: "Failed to delete voided sale" },
      { status: 500 }
    );
  }
}

// POST - Restore a voided sale
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // First verify the sale is actually voided
    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    if (sale.paymentStatus !== "CANCELLED") {
      return NextResponse.json(
        { error: "Only voided sales can be restored" },
        { status: 400 }
      );
    }

    // Restore the sale by updating its status
    const restoredSale = await prisma.sale.update({
      where: { id },
      data: {
        paymentStatus: "COMPLETED", // Or whatever status makes sense
        voidReason: null,
      },
    });

    return NextResponse.json(
      { message: "Sale restored successfully", sale: restoredSale },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error restoring voided sale:", error);
    return NextResponse.json(
      { error: "Failed to restore voided sale" },
      { status: 500 }
    );
  }
}
