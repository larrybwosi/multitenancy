import { NextRequest, NextResponse } from 'next/server';
import { ValidationError, NotFoundError, AlreadyCheckedInError, AppError } from '@/utils/errors';
import { checkInMember, getOrganizationAndDefaultLocation } from '@/actions/attendance';
import { getServerAuthContext } from '@/actions/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inventoryLocationId, notes } = body;
    const { organizationId, memberId} = await getServerAuthContext()
    if (!inventoryLocationId) {
        const orgDetails = await getOrganizationAndDefaultLocation(organizationId);
        const attendance = await checkInMember(memberId,memberId, organizationId, orgDetails.warehouse?.id|| '', notes);
        return NextResponse.json({
          organization: orgDetails.organization,
          warehouse: orgDetails.warehouse,
          requiresLocationSelection: true,
          attendance,
        });
    }

    const orgDetails = await getOrganizationAndDefaultLocation(organizationId);
    const attendanceLog = await checkInMember(memberId, memberId, organizationId, inventoryLocationId, notes);
    return NextResponse.json({
      organization: orgDetails.organization,
      warehouse: orgDetails.warehouse,
      requiresLocationSelection: true,
      attendance: attendanceLog,
    });
    
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
