// app/api/units-of-measure/route.ts
import { getServerAuthContext } from '@/actions/auth';
import { createUnitOfMeasure, getUnitsOfMeasure } from '@/actions/units';
import { UnitType } from '@/prisma/client';
import { NextResponse } from 'next/server';


export async function GET() {
  const { organizationId } = await getServerAuthContext();

  if (!organizationId) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 400 }
    );
  }

  const result = await getUnitsOfMeasure(organizationId);

  return NextResponse.json(result);
}
export async function POST(request: Request) {
  try {
    const input = await request.json();

    // Validate input
    if (!input.name || !input.symbol || !input.organizationId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields (name, symbol, organizationId)' },
        { status: 400 }
      );
    }

    // Process the unit creation
    const unit = await createUnitOfMeasure({
      ...input,
      unitType: input.unitType || UnitType.COUNT,
    });

    return NextResponse.json(unit);
    //eslint-disable-next-line
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
