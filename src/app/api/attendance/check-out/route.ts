import { checkOutMember } from "@/actions/attendance";
import { getServerAuthContext } from "@/actions/auth";
import { handleApiError } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId: memberId, organizationId } = await getServerAuthContext();

  const { notes } = await req.json();

  if (!memberId || !organizationId) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const attendance = await checkOutMember(memberId, organizationId, notes);
    return NextResponse.json(attendance);
  } catch (error) {
    return handleApiError(error);
  }
}
