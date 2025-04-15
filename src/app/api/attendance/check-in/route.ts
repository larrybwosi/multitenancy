import { checkInMember } from "@/actions/attendance";
import { getServerAuthContext } from "@/actions/auth";
import { handleApiError } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId: memberId, organizationId } = await getServerAuthContext()

  const { locationId, notes } = await req.json();
  

  if (!memberId || !organizationId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

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
