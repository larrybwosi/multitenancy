import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { getServerAuthContext } from "@/actions/auth";

// Organization schema for validation
const updateOrgSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(30).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  logo: z.string().optional(),
});

// GET current organization
export async function GET() {
  try {
    const {organizationId } = await getServerAuthContext()
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH update organization
export async function PATCH(request: NextRequest) {
  try {
    const { organizationId: orgId } = await getServerAuthContext();


    // Parse and validate request body
    const body = await request.json();
    
    const validationResult = updateOrgSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: "Validation error", 
          errors: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { name, slug, description, logo } = validationResult.data;

    // Check if slug is already taken by another organization
    if (slug) {
      const existingOrg = await db.organization.findFirst({
        where: {
          slug,
          id: { not: orgId },
        },
      });

      if (existingOrg) {
        return NextResponse.json(
          { message: "Organization URL is already taken" },
          { status: 400 }
        );
      }
    }

    // Update organization
    const updatedOrganization = await db.organization.update({
      where: { id: orgId },
      data: {
        name,
        slug,
        description,
        logo,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
      },
    });

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}