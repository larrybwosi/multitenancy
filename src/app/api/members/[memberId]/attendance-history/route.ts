import { getServerAuthContext } from "@/actions/auth";
import { handleApiError } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

type Params = Promise<{ memberId: string }>;

export async function GET(
  req: Request,
  { params }: { params: Params }
) {
  const { organizationId } = await getServerAuthContext();
  const session = await auth.api.getSession({ headers: await headers() });

  const { memberId } = await params;

  // Security check
  if (
    memberId !== session?.user.id &&
    !["ADMIN", "OWNER", "MANAGER"].includes(session?.user.role || '')
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const history = await db.attendance.findMany({
      where: { memberId, organizationId },
      orderBy: { checkInTime: "desc" },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error("History fetch error:", error);
    return handleApiError(error)
  }
}
