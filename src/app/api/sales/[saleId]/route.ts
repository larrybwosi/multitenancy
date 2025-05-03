import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const { saleId } = await params;
  if (!saleId) {
    return NextResponse.json({ error: "Sale ID is required" }, { status: 400 });
  }
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: saleId},
      include: {
        customer: true,
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    imageUrls: true,
                    name: true,
                  },
                }
              },
            },
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Failed to fetch sale:", error);
    return NextResponse.json(
      { error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}

// Potentially add PUT for updates (e.g., status changes, refunds - complex)
// Potentially add DELETE for voiding (complex - requires stock reversal)
