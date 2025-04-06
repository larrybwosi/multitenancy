// app/api/stock/batches/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  // Auth check
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const variantId = searchParams.get("variantId"); // Optional
  const includeEmpty = searchParams.get("includeEmpty") === "true"; // Optional flag

  const where: {
    productId?: string;
    variantId?: string | null;
    currentQuantity?: { gt: number };
  } = {};
  
  if (productId) where.productId = productId;
  if (variantId) where.variantId = variantId;
  else if (productId) where.variantId = null; // If productId provided but not variantId, look for non-variant batches

  if (!includeEmpty) {
    where.currentQuantity = { gt: 0 }; // Default: only show batches with stock
  }

  try {
    const batches = await prisma.stockBatch.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        variant: { select: { name: true, sku: true } },
        purchaseItem: {
          // Link back to PO item if exists
          select: {
            id: true,
            purchase: { select: { id: true, purchaseNumber: true } },
          },
        },
      },
      orderBy: [
        { productId: "asc" },
        { variantId: "asc" },
        { receivedDate: "asc" }, // Order by received date
      ],
    });
    return NextResponse.json(batches);
  } catch (error) {
    console.error("Failed to fetch stock batches:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
