import { getServerAuthContext } from "@/actions/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const {userId} = await getServerAuthContext();
    // Fetch user with their active organization membership
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        activeOrganizationId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch member details for the active organization
    let member = null;
    if (user.activeOrganizationId) {
      member = await db.member.findFirst({
        where: {
          userId: user.id,
          organizationId: user.activeOrganizationId,
        },
        select: {
          id: true,
          role: true,
          isActive: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              description: true,
            },
          },
        },
      });
    }

    return NextResponse.json({ user, member });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
