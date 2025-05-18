import { NextRequest, NextResponse } from "next/server";
import { MemberRole } from "@/prisma/client";
import { db } from "@/lib/db";
import { getServerAuthContext } from "@/actions/auth";
import {
  handleApiError,
  AuthorizationError,
  NotFoundError,
} from "@/lib/api-utils"; 
import { updateMemberBulkSchema } from "@/lib/validations/members";
import { createUserAndMember } from "@/actions/organization";

// GET - List all members in the organization
export async function GET(request: Request) {
  try {
    // 1. Authentication & Base Authorization
    // getServerAuthContext should ideally throw if no session or org found
    const { organizationId, userId } = await getServerAuthContext();
    if (!organizationId || !userId) {
      throw new AuthorizationError("Authentication required.");
    }

    // 2. Core Logic
    const members = await db.member.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            banned: true, // Keep these fields from original
            banReason: true,
            banExpires: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const membersDetails = members.map((m)=>{
     return {
      ...m,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image
     }
    })

    // 3. Success Response
    return NextResponse.json({ members: membersDetails });
  } catch (error) {
    // 4. Error Handling
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const result = await createUserAndMember(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.log(error)
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: error.status || 500 });
  }
}
// PATCH - Update a member's role/status (original bulk-like function)
export async function PATCH(request: Request) {
  try {
    // 1. Authentication & Base Authorization
    const { userId, organizationId } = await getServerAuthContext();
    if (!organizationId || !userId) {
      throw new AuthorizationError("Authentication required.");
    }

    // 2. Body Parsing & Validation
    const body = await request.json();
    const validatedData = updateMemberBulkSchema.parse(body);
    const { memberId, role, isActive } = validatedData;

    // 3. Specific Authorization Logic (Admin/Owner check)
    const currentMember = await db.member.findFirst({
      where: {
        userId,
        organizationId,
        role: { in: [MemberRole.OWNER, MemberRole.ADMIN] },
      },
      select: { role: true }, // Only select needed field
    });

    if (!currentMember) {
      throw new AuthorizationError(
        "You don't have permission to perform this action."
      );
    }

    // 4. Core Logic
    const memberToUpdate = await db.member.findUnique({
      where: { id: memberId, organizationId }, // Ensure member belongs to the org
      select: { role: true }, // Only select needed field
    });

    if (!memberToUpdate) {
      // Use custom error or let Prisma handle potentially (P2025 in update)
      throw new NotFoundError("Member not found in this organization.");
    }

    // Cannot modify owners unless you're an owner
    if (
      memberToUpdate.role === MemberRole.OWNER &&
      currentMember.role !== MemberRole.OWNER
    ) {
      throw new AuthorizationError("Only owners can modify other owners.");
    }

    // Update member
    const updatedMember = await db.member.update({
      where: { id: memberId },
      data: {
        // Only include fields if they are present in the validated data
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            // Also include ban status here if relevant for response
            banned: true,
            banReason: true,
            banExpires: true,
          },
        },
      },
    });

    // 5. Success Response
    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    // 6. Error Handling
    return handleApiError(error);
  }
}
