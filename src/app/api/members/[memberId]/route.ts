import { NextResponse } from "next/server";
import { Prisma, MemberRole } from "@prisma/client";
import { db } from "@/lib/db";
import {  getServerAuthContext } from "@/actions/auth";
import {
  handleApiError,
  AuthorizationError,
  NotFoundError,
} from "@/lib/api-utils";
import {
  memberParamsSchema,
  updateMemberDetailsSchema,
  deleteMemberParamsSchema,
  getMemberParamsSchema,
} from "@/lib/validations/members";

// GET - Fetch a specific member
export async function GET(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    // 1. Authentication
    const { organizationId, userId } = await getServerAuthContext();
    if (!organizationId || !userId) {
      throw new AuthorizationError("Authentication required.");
    }

    // 2. Parameter Validation
    const { memberId } = getMemberParamsSchema.parse(params);

    // 3. Core Logic
    const member = await db.member.findUnique({
      where: { id: memberId, organizationId }, // Ensure member is in the correct org
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            banned: true,
            banReason: true,
            banExpires: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundError("Member not found.");
    }

    // 4. Success Response
    return NextResponse.json({ member });
  } catch (error) {
    // 5. Error Handling
    return handleApiError(error);
  }
}

// PATCH - Update a specific member's details (role, ban status etc.)
export async function PATCH(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    // 1. Authentication & Base Authorization
    const { userId, organizationId } = await getServerAuthContext();
    if (!organizationId || !userId) {
      throw new AuthorizationError("Authentication required.");
    }

    // 2. Parameter Validation
    const { memberId } = memberParamsSchema.parse(params);

    // 3. Body Parsing & Validation
    const body = await request.json();
    const validatedData = updateMemberDetailsSchema.parse(body);
    const { role, isActive, banned, banReason, banExpires } = validatedData;

    // 4. Specific Authorization Logic (Owner check for this endpoint)
    const currentMember = await db.member.findFirst({
      where: { userId, organizationId, role: MemberRole.OWNER },
      select: { role: true }, // Only need role for check
    });

    if (!currentMember) {
      throw new AuthorizationError("Only owners can perform this action.");
    }

    // 5. Core Logic - Use Transaction
    const memberToUpdate = await db.member.findUnique({
      where: { id: memberId, organizationId },
      select: { role: true, userId: true }, // Select fields needed for checks and updates
    });

    if (!memberToUpdate) {
      throw new NotFoundError("Member not found in this organization.");
    }

    // Cannot modify owners (redundant check if only owner can access, but good practice)
    if (memberToUpdate.role === MemberRole.OWNER) {
      // Optionally allow owner to modify self, otherwise prevent
      if (memberToUpdate.userId !== userId) {
        throw new AuthorizationError(
          "Owners cannot modify other owners directly via this endpoint."
        );
      }
      // If allowing self-update, ensure owner cannot demote themselves from owner role
      if (role && role !== MemberRole.OWNER) {
        throw new AuthorizationError(
          "Owners cannot change their own role from Owner."
        );
      }
    }

    // Perform updates in a transaction
    const updatedMemberData = await db.$transaction(async (tx) => {
      // Update member role/isActive if provided
      const memberUpdateData: Prisma.MemberUpdateInput = {};
      if (role !== undefined) memberUpdateData.role = role;
      if (isActive !== undefined) memberUpdateData.isActive = isActive; // Add isActive update

      if (Object.keys(memberUpdateData).length > 0) {
        await tx.member.update({
          where: { id: memberId },
          data: memberUpdateData,
        });
      }

      // Update user ban status if provided
      if (banned !== undefined) {
        await tx.user.update({
          where: { id: memberToUpdate.userId },
          data: {
            banned,
            // Set reason/expires only if banning; clear if unbanning
            banReason: banned ? banReason || null : null,
            banExpires: banned && banExpires ? new Date(banExpires) : null,
          },
        });
      }

      // Refetch the updated member with user details for the response
      const finalMember = await tx.member.findUniqueOrThrow({
        // Use findUniqueOrThrow inside transaction
        where: { id: memberId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              banned: true,
              banReason: true,
              banExpires: true,
            },
          },
        },
      });
      return finalMember;
    });

    // 6. Success Response
    return NextResponse.json({ member: updatedMemberData });
  } catch (error) {
    // 7. Error Handling
    return handleApiError(error);
  }
}

// DELETE - Remove a member from the organization
export async function DELETE(
  request: Request,
  { params }: { params: { memberId: string } }
) {
  try {
    // 1. Authentication & Base Authorization
    const { userId, organizationId } = await getServerAuthContext();
    if (!organizationId || !userId) {
      throw new AuthorizationError("Authentication required.");
    }

    // 2. Parameter Validation
    const { memberId } = deleteMemberParamsSchema.parse(params);

    // 3. Specific Authorization Logic (Admin/Owner check)
    // Use checkUserAuthorization or implement check here
    const currentMember = await db.member.findFirst({
      where: {
        userId,
        organizationId,
        role: { in: [MemberRole.OWNER, MemberRole.ADMIN] },
      },
      select: { role: true },
    });

    if (!currentMember) {
      throw new AuthorizationError(
        "You don't have permission to perform this action."
      );
    }

    // 4. Core Logic
    const memberToDelete = await db.member.findUnique({
      where: { id: memberId, organizationId },
      select: { role: true, userId: true }, // Select needed fields
    });

    if (!memberToDelete) {
      throw new NotFoundError("Member not found.");
    }

    // Cannot delete owners unless you're an owner
    if (
      memberToDelete.role === MemberRole.OWNER &&
      currentMember.role !== MemberRole.OWNER
    ) {
      throw new AuthorizationError("Only owners can remove other owners.");
    }

    // Cannot delete yourself
    if (memberToDelete.userId === userId) {
      throw new AuthorizationError(
        "You cannot remove yourself from the organization."
      ); // 403 might be more appropriate than 400
    }

    // Delete member
    await db.member.delete({
      where: { id: memberId },
    });

    // 5. Success Response
    return NextResponse.json({ success: true });
  } catch (error) {
    // 6. Error Handling
    return handleApiError(error);
  }
}
