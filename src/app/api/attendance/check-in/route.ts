import { checkInMember } from "@/actions/attendance";
import { getMemberAndOrgDetails } from "@/actions/auth";
import { handleApiError } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {

  const { locationId, notes, email, password } = await req.json();
  //Sign in the user with email and password
  const user = await auth.api.signInEmail({
    body: {
      email,
      password,
      rememberMe: true,
    }
  });
  // Check if the user is authenticated
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await auth.api.getSession({headers: await headers()});

  let organizationId: string | undefined | null = undefined;
  // Get the organizationId from the session
  organizationId = session?.session?.activeOrganizationId;

  if (!organizationId) {
    // Get the organizationId from the user
    const userOrg = await db.user.findUnique({
      where: { id: user.user.id },
      select: { activeOrganizationId: true },
    });
    organizationId = userOrg?.activeOrganizationId;
  }

  const { memberId } = await getMemberAndOrgDetails(user.user.id, organizationId!);
  if (!memberId || !organizationId) {
    return NextResponse.json({ error: "Member not found or organization not found" }, { status: 404 });
  }
  try {
    const attendance = await checkInMember(
      memberId,
      organizationId,
      locationId,
      notes
    );
    console.log("Attendance checked in:", attendance);

    return NextResponse.json(attendance);
  } catch (error) {
    console.error("Check-in error:", error);
    return handleApiError(error)
  }
}
