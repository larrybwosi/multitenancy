import { NextRequest, NextResponse } from 'next/server';
import { ValidationError, NotFoundError, AlreadyCheckedInError, AppError } from '@/utils/errors';
import { checkInMember } from '@/actions/attendance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { actingMemberId, memberToCheckInId, organizationId, inventoryLocationId, notes } = body;

    if (!actingMemberId || !memberToCheckInId || !organizationId || !inventoryLocationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const attendanceLog = await checkInMember(
      actingMemberId,
      memberToCheckInId,
      organizationId,
      inventoryLocationId,
      notes
    );

    return NextResponse.json(attendanceLog, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AlreadyCheckedInError) {
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
