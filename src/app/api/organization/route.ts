import { createOrganization } from "@/actions/organization";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  
  try {
    const org = await createOrganization(body);
    
    return NextResponse.json(org);
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const activeOrgId = session.session?.activeOrganizationId;
    if (!activeOrgId) {
      return new NextResponse("No active organization", { status: 404 });
    }

    const organization = await db.organization.findUnique({
      where: {
        id: activeOrgId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
      },
    });

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 });
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}