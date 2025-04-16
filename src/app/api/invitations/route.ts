import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { MemberRole } from "@prisma/client";
import { getServerAuthContext } from "@/actions/auth";

// GET /api/invitations
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const invitations = await db.invitation.findMany({
      where: {
        organization: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(MemberRole),
  organizationId: z.string(),
});

// POST /api/invitations
export async function POST(req: Request) {
  try {
  const { userId, organizationId } = await getServerAuthContext();

    const json = await req.json();
    const body = inviteSchema.parse(json);

    // Check if user is already a member
    const existingMember = await db.member.findFirst({
      where: {
        organizationId,
        user: {
          email: body.email,
        },
      },
    });

    if (existingMember) {
      return new NextResponse("User is already a member", { status: 400 });
    }

    // Check for existing pending invitation
    const existingInvitation = await db.invitation.findFirst({
      where: {
        organizationId,
        email: body.email,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      return new NextResponse("Invitation already exists", { status: 400 });
    }

    const invitation = await db.invitation.create({
      data: {
        email: body.email,
        role: body.role,
        status: "PENDING",
        token: crypto.randomUUID(),
        organizationId,
        inviterId: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // TODO: Send invitation email

    return NextResponse.json(invitation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.message, { status: 400 });
    }
    console.error("Error creating invitation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
