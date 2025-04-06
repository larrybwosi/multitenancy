// app/api/sales/[saleId]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { saleId: string } }
) {
  // Add Auth checks
  const saleId = params.saleId;
  if (!saleId) {
    return NextResponse.json({ error: "Sale ID required" }, { status: 400 });
  }

  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        customer: true, // Include full customer details
        user: { select: { id: true, name: true, email: true } }, // User who made sale
        items: {
          // Include detailed items
          include: {
            product: { select: { id: true, name: true, sku: true } },
            variant: { select: { id: true, name: true, sku: true } },
            stockBatch: {
              select: { id: true, batchNumber: true, purchasePrice: true },
            }, // Show batch info
          },
        },
        cashDrawer: true, // If applicable
        loyaltyTransaction: true, // Show linked loyalty transaction
        attachments: true, // Show attachments
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error(`Failed to get sale details for ${saleId}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Potentially add PUT for updates (e.g., status changes, refunds - complex)
// Potentially add DELETE for voiding (complex - requires stock reversal)
