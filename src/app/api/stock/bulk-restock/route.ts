import { bulkRestockProducts } from '@/actions/units';
import { MovementType } from '@/prisma/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const input = await request.json();

    // Validate input
    if (!input.items || !input.locationId || !input.memberId || !input.organizationId) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Process the restock
    const result = await bulkRestockProducts({
      ...input,
      restockDate: input.restockDate ? new Date(input.restockDate) : undefined,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
      movementType: input.movementType || MovementType.PURCHASE_RECEIPT,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
