import {checkInMember, getOrganizationAndDefaultLocation} from '@/actions/attendance';
import {getServerAuthContext} from '@/actions/auth';
import {handleApiError} from '@/lib/api-utils';
import {NextResponse} from 'next/server';

export async function POST(req: Request) {
  const {locationId, notes} = await req.json();
  const {memberId, organizationId} = await getServerAuthContext();

  try {
    // If no locationId is provided, return organization and default warehouse details
    if (!locationId) {
      const orgDetails = await getOrganizationAndDefaultLocation(organizationId);
      const attendance = await checkInMember(memberId, organizationId, orgDetails.warehouse?.id, notes);
      return NextResponse.json({
        organization: orgDetails.organization,
        warehouse: orgDetails.warehouse,
        requiresLocationSelection: true,
        attendance,
      });
    }

    // Proceed with check-in if location is provided
    const attendance = await checkInMember(memberId, organizationId, locationId, notes);

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Check-in error:', error);
    return handleApiError(error);
  }
}
