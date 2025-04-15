import { getServerAuthContext } from "@/actions/auth";
import { handleApiError } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type Params = Promise<{memberId: string}>
export async function GET(
  req: Request,
  { params }: { params: Params }
) {
  const { organizationId } = await getServerAuthContext();
  const session = await auth.api.getSession({ headers: await headers()})

  const {memberId} = await params;

  // Security check
  if (
    memberId !== session?.user.id &&
    !["ADMIN", "OWNER", "MANAGER"].includes(session?.user.role || "") 
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const member = await db.member.findUnique({
      where: { id: memberId, organizationId },
      select: {
        isCheckedIn: true,
        lastCheckInTime: true,
        currentLocationId: true,
        currentLocation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    let activeAttendance = null;
    if (member.isCheckedIn) {
      activeAttendance = await db.attendance.findFirst({
        where: {
          memberId,
          checkOutTime: null,
        },
        orderBy: {
          checkInTime: "desc",
        },
      });
    }

    return NextResponse.json({
      ...member,
      activeAttendance,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
