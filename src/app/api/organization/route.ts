import { createOrganization, updateOrganization } from "@/actions/organization";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerAuthContext } from "@/actions/auth";

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
    const {organizationId } = await getServerAuthContext()

    const organization = await db.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        settings: true,
      },
    });

    if (!organization) {
      return new NextResponse("Organization not found", { status: 404 });
    }
    const org = {...organization, ...organization.settings}

    return NextResponse.json(org);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    console.log(body)
    
    const {organizationId } = await getServerAuthContext()
    const updatedOrg = await updateOrganization(organizationId, body);
    console.log(updatedOrg);
    return NextResponse.json(updatedOrg);
  } catch (error) {
    console.error("Error updating organization:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}