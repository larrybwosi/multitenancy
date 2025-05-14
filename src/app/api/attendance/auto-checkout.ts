import { NextRequest, NextResponse } from 'next/server';
import { ValidationError, NotFoundError, AppError } from '@/utils/errors';
import { setOrganizationAutoCheckoutSettings } from '@/actions/attendance';

export async function PATCH(request: NextRequest, { params }: { params: { organizationId: string } }) {
  try {
    const { organizationId } = params;
    const body = await request.json();
    const { enableAutoCheckout, autoCheckoutTime } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const settings = await setOrganizationAutoCheckoutSettings(organizationId, {
      enableAutoCheckout,
      autoCheckoutTime,
    });

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
