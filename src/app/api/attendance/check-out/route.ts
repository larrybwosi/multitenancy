import { NextRequest, NextResponse } from 'next/server';
import { ValidationError, NotFoundError, NotCheckedInError, AppError } from '@/utils/errors';
import { checkOutMember } from '@/actions/attendance';
import { getServerAuthContext } from '@/actions/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inventoryLocationId: checkoutInventoryLocationId, notes } = body;
    const { organizationId, memberId } = await getServerAuthContext();
    // const { actingMemberId, memberToCheckoutId, } = body;

    // if (!actingMemberId || !memberToCheckoutId || !organizationId) {
    //   return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    // }

    const attendanceLog = await checkOutMember(memberId, memberId, organizationId, notes, checkoutInventoryLocationId);

    return NextResponse.json(attendanceLog, { status: 200 });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotCheckedInError) {
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
