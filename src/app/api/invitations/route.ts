import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { MemberRole } from "@prisma/client";

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
    const json = await req.json();
    const body = inviteSchema.parse(json);
    console.log("Parsed body:", body);
    

    // const invitation = await createInvitation({
    //   inviteeEmail: body.email,
    //   role: body.role,
    // })
    
    return NextResponse.json({});
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.message, { status: 400 });
    }
    console.error("Error creating invitation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
