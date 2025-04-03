// actions/admin.actions.ts
"use server";

import { z } from "zod";
import { db } from "@/lib/db"; // Assuming Prisma client setup
import { Organisation, Member, MemberRole } from "@prisma/client";
import { revalidatePath } from "next/cache";


// --- Zod Schemas for Validation ---

const OrganisationIdSchema = z
  .string()
  .cuid({ message: "Invalid Organisation ID" });

const UpdateOrganisationSchema = z.object({
  id: OrganisationIdSchema,
  name: z
    .string()
    .min(2, { message: "Organisation name must be at least 2 characters" })
    .optional(),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, {
      message: "Slug must be lowercase alphanumeric characters or hyphens",
    })
    .optional(), // Ensure slug validity if updating
  description: z.string().max(500).optional().nullable(),
});

const AddMemberSchema = z.object({
  organisationId: OrganisationIdSchema,
  userEmail: z.string().email({ message: "Invalid email address" }),
  role: z.nativeEnum(MemberRole),
});

const UpdateMemberRoleSchema = z.object({
  memberId: z.string().cuid({ message: "Invalid Member ID" }),
  organisationId: OrganisationIdSchema, // For authorization check
  role: z.nativeEnum(MemberRole),
});

const RemoveMemberSchema = z.object({
  memberId: z.string().cuid({ message: "Invalid Member ID" }),
  organisationId: OrganisationIdSchema, // For authorization check
});

// --- Types for Return Values ---

type ActionResponse<T = null> = Promise<
  { success: true; data: T } | { success: false; error: string; details?: any }
>;

// --- Server Actions ---

/**
 * Updates Organisation Details (Name, Slug, Description)
 * Requires appropriate admin privileges for the specific organisation.
 */
export async function updateOrganisation(
  input: z.infer<typeof UpdateOrganisationSchema>
): ActionResponse<Organisation> {
  try {
    // !! IMPORTANT: Authorization Check !!
    // const auth = await getAuthContext(); // Get user/session
    // Check if auth.userId is an ADMIN/OWNER of input.id organisation
    // Example: const member = await db.member.findUnique({ where: { userId_organisationId: { userId: auth.userId, organisationId: input.id } } });
    // if (!member || (member.role !== MemberRole.ADMIN && member.role !== MemberRole.OWNER)) {
    //   return { success: false, error: "Unauthorized" };
    // }

    const validation = UpdateOrganisationSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid input data.",
        details: validation.error.format(),
      };
    }

    const { id, ...updateData } = validation.data;

    // Prevent updating slug if already set? Or handle conflicts?
    // Check if slug is unique if provided
    if (updateData.slug) {
      const existing = await db.organisation.findFirst({
        where: { slug: updateData.slug, NOT: { id: id } },
      });
      if (existing) {
        return {
          success: false,
          error: `Slug "${updateData.slug}" is already taken.`,
        };
      }
    }

    const updatedOrganisation = await db.organisation.update({
      where: { id: id },
      data: updateData,
    });

    revalidatePath(`/admin/organisations/${updatedOrganisation.slug}`); // Revalidate relevant path
    revalidatePath(`/admin/organisations`);

    return { success: true, data: updatedOrganisation };
  } catch (error) {
    console.error("Failed to update organisation:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      if (error.message.includes("slug"))
        return { success: false, error: "Organisation slug is already taken." };
    }
    return {
      success: false,
      error: "Failed to update organisation. Please try again.",
    };
  }
}

/**
 * Adds a User as a Member to an Organisation.
 * Requires appropriate admin privileges for the specific organisation.
 */
export async function addMember(
  input: z.infer<typeof AddMemberSchema>
): ActionResponse<Member> {
  try {
    // !! IMPORTANT: Authorization Check !!
    // const auth = await getAuthContext();
    // Check if auth.userId is ADMIN/OWNER of input.organisationId

    const validation = AddMemberSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid input data.",
        details: validation.error.format(),
      };
    }

    const { organisationId, userEmail, role } = validation.data;

    // Find the user by email
    const user = await db.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      // Option 1: Return error - User must exist
      return {
        success: false,
        error: `User with email ${userEmail} not found.`,
      };
      // Option 2: Invite flow - Create an invitation record instead
      // Option 3: Create user on the fly (less common for membership)
    }

    // Check if user is already a member
    const existingMember = await db.member.findUnique({
      where: { userId_organisationId: { userId: user.id, organisationId } },
    });

    if (existingMember) {
      return {
        success: false,
        error: "User is already a member of this organisation.",
      };
    }

    // Create the membership
    const newMember = await db.member.create({
      data: {
        userId: user.id,
        organisationId: organisationId,
        role: role,
      },
      include: { user: { select: { name: true, email: true } } }, // Include some user details
    });

    revalidatePath(`/admin/organisations/${organisationId}/members`);

    return { success: true, data: newMember };
  } catch (error) {
    console.error("Failed to add member:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint failed")
    ) {
      return {
        success: false,
        error: "User is already a member of this organisation.",
      };
    }
    return { success: false, error: "Failed to add member. Please try again." };
  }
}

/**
 * Updates a Member's Role within an Organisation.
 * Requires appropriate admin privileges for the specific organisation.
 */
export async function updateMemberRole(
  input: z.infer<typeof UpdateMemberRoleSchema>
): ActionResponse<Member> {
  try {
    // !! IMPORTANT: Authorization Check !!
    // const auth = await getAuthContext();
    // Check if auth.userId is ADMIN/OWNER of input.organisationId
    // Also check if the user is trying to modify the OWNER role or their own role improperly

    const validation = UpdateMemberRoleSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid input data.",
        details: validation.error.format(),
      };
    }

    const { memberId, organisationId, role } = validation.data;

    // Add logic to prevent removing the last OWNER?

    const updatedMember = await db.member.update({
      where: { id: memberId, organisationId: organisationId }, // Ensure it's the correct org
      data: {
        role: role,
      },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!updatedMember) {
      return {
        success: false,
        error: "Member not found in this organisation.",
      };
    }

    revalidatePath(`/admin/organisations/${organisationId}/members`);

    return { success: true, data: updatedMember };
  } catch (error) {
    console.error("Failed to update member role:", error);
    return {
      success: false,
      error: "Failed to update member role. Please try again.",
    };
  }
}

/**
 * Removes a Member from an Organisation.
 * Requires appropriate admin privileges for the specific organisation.
 */
export async function removeMember(
  input: z.infer<typeof RemoveMemberSchema>
): ActionResponse<{ memberId: string }> {
  try {
    // !! IMPORTANT: Authorization Check !!
    // const auth = await getAuthContext();
    // Check if auth.userId is ADMIN/OWNER of input.organisationId
    // Also check if the user is trying to remove the OWNER role or themselves improperly

    const validation = RemoveMemberSchema.safeParse(input);
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid input data.",
        details: validation.error.format(),
      };
    }

    const { memberId, organisationId } = validation.data;

    // Add logic to prevent removing the last OWNER?

    const deletedMember = await db.member.delete({
      where: { id: memberId, organisationId: organisationId }, // Ensure it's the correct org
    });

    if (!deletedMember) {
      return {
        success: false,
        error: "Member not found in this organisation.",
      };
    }

    revalidatePath(`/admin/organisations/${organisationId}/members`);

    return { success: true, data: { memberId } };
  } catch (error) {
    console.error("Failed to remove member:", error);
    return {
      success: false,
      error: "Failed to remove member. Please try again.",
    };
  }
}

// --- Read Actions (Example) ---

/**
 * Fetches details for a single organisation.
 * Access might be restricted based on user membership or super admin status.
 */
export async function getOrganisationDetails(
  organisationId: string
): ActionResponse<Organisation | null> {
  try {
    // !! IMPORTANT: Authorization Check !!
    // const auth = await getAuthContext();
    // Check if auth.userId is member of organisationId OR isSuperAdmin

    const validation = OrganisationIdSchema.safeParse(organisationId);
    if (!validation.success) {
      return { success: false, error: "Invalid Organisation ID." };
    }

    const organisation = await db.organisation.findUnique({
      where: { id: validation.data },
    });

    if (!organisation) {
      return { success: false, error: "Organisation not found." };
    }

    return { success: true, data: organisation };
  } catch (error) {
    console.error("Failed to fetch organisation details:", error);
    return { success: false, error: "Failed to fetch organisation details." };
  }
}

/**
 * Fetches members for a given organisation.
 * Requires appropriate permissions (e.g., be a member of the org).
 */
export async function getOrganisationMembers(
  organisationId: string
): ActionResponse<Member[]> {
  try {
    // !! IMPORTANT: Authorization Check !!
    // const auth = await getAuthContext();
    // Check if auth.userId is member of organisationId

    const validation = OrganisationIdSchema.safeParse(organisationId);
    if (!validation.success) {
      return { success: false, error: "Invalid Organisation ID." };
    }

    const members = await db.member.findMany({
      where: { organisationId: validation.data },
      include: {
        user: { select: { id: true, name: true, email: true } }, // Select needed user fields
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, data: members };
  } catch (error) {
    console.error("Failed to fetch organisation members:", error);
    return { success: false, error: "Failed to fetch organisation members." };
  }
}
