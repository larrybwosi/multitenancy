import { getServerAuthContext } from "@/actions/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
  const { organizationId } = await getServerAuthContext();
    

    const invitation = await db.invitation.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!invitation) {
      return new NextResponse("Invitation not found", { status: 404 });
    }

    await db.invitation.delete({
      where: {
        id: id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PATCH /api/invitations/[id]/resend
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params;
  const { organizationId } = await getServerAuthContext();

    const invitation = await db.invitation.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!invitation) {
      return new NextResponse("Invitation not found", { status: 404 });
    }

    // Update expiration and token
    const updated = await db.invitation.update({
      where: {
        id: params.id,
      },
      data: {
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        token: crypto.randomUUID(),
      },
    });

    // TODO: Resend invitation email

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error resending invitation:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}