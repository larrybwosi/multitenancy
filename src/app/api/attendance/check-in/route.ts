import { checkInMember } from "@/actions/attendance";
import { getServerAuthContext } from "@/actions/auth";
import { handleApiError } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export async function POST(req: Request) {

  const { locationId, notes } = await req.json();
  
  const { memberId, organizationId} = await getServerAuthContext();
  try {
    const attendance = await checkInMember(
      memberId,
      organizationId,
      locationId,
      notes
    );

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Check-in error:", error);
    return handleApiError(error)
  }
}
