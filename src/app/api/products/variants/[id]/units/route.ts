// app/api/product-variants/[id]/units/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { configureProductVariantUnits } from '@/actions/units';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const input = await request.json();
    const { id: productVariantId} = await params;

    // Validate input
    if (!input.baseUnitId || !input.stockingUnitId || !input.sellingUnitId) {
      return NextResponse.json({ success: false, message: 'Missing required unit fields' }, { status: 400 });
    }

    // Verify the product variant exists
    const variantExists = await prisma.productVariant.findUnique({
      where: { id: productVariantId },
      select: { id: true },
    });

    if (!variantExists) {
      return NextResponse.json({ success: false, message: 'Product variant not found' }, { status: 404 });
    }

    // Process the unit configuration
    const updatedVariant = await configureProductVariantUnits({
      productVariantId,
      ...input,
    });

    return NextResponse.json(updatedVariant);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
