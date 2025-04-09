// actions/admin-actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma, UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { v4 as uuid} from 'uuid';
// import { getCurrentUserId } from '@/lib/auth'; // <<< --- IMPORTANT: You NEED a way to get the current user's ID

// --- Action Return Type (Ensure this type exists or define it) ---
type ActionResponse<T = null> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[] | undefined> | null;
};

// --- New Schema for Creating an Organization ---
const CreateOrganizationSchema = z.object({
  name: z.string().min(3, "Organization name must be at least 3 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    )
    .optional()
    .or(z.literal("")), // Allow empty string, we'll generate if empty
});

// --- Helper Function (Placeholder - Implement Real Auth) ---
async function getCurrentUserId(): Promise<string | null> {
  // This is crucial. Replace with your actual authentication logic
  // to get the ID of the currently logged-in user.
  // Example using Clerk (if you were using it):
  // import { auth } from "@clerk/nextjs/server";
  // const { userId } = auth();
  // return userId;

  // Example Placeholder:
  console.warn(
    "Using placeholder user ID in createOrganization. Implement real authentication!"
  );
  // Find *any* user to act as the creator for demo purposes ONLY.
  const demoUser = await db.user.findFirst();
  console.log(demoUser);
  return demoUser?.id ?? null;
  // return "user_placeholder_id_implement_real_auth"; // Or a hardcoded ID for testing
}

// --- New Server Action: Create Organization ---
export async function createOrganization(
  prevState: ActionResponse<{ organizationId: string }> | null,
  formData: FormData
): Promise<ActionResponse<{ organizationId: string }>> {
  try {
    // --- Get Current User ID ---
    const userId = await getCurrentUserId();
    if (!userId) {
      return {
        success: false,
        message: "Authentication required to create an organization.",
      };
    }

    // --- Validation ---
    const validatedFields = CreateOrganizationSchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Validation failed.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { name } = validatedFields.data;
    let slug = validatedFields.data.slug;

    // --- Slug Generation & Uniqueness Check ---
    if (!slug) {
      slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      // Basic check if generated slug is valid (e.g., not empty after sanitization)
      if (slug.length < 3) {
        // Append something random if generated slug is too short or invalid
        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
      }
    }

    // Check if slug already exists (case-insensitive check recommended for slugs)
    const existingOrgBySlug = await db.organization.findFirst({
      where: { slug: { equals: slug, mode: "insensitive" } },
    });

    if (existingOrgBySlug) {
      // If the slug was auto-generated, try appending random chars. If user-provided, return error.
      if (!validatedFields.data.slug) {
        // It was auto-generated
        slug = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
        // Re-check uniqueness (less likely collision now, but possible)
        const existingOrgByGeneratedSlug = await db.organization.findFirst({
          where: { slug: { equals: slug, mode: "insensitive" } },
        });
        if (existingOrgByGeneratedSlug) {
          return {
            success: false,
            message: "Failed to generate a unique slug. Please provide one.",
            errors: {
              slug: ["Failed to automatically generate a unique slug."],
            },
          };
        }
      } else {
        // User provided the slug
        return {
          success: false,
          message: "Slug already taken.",
          errors: {
            slug: ["This slug is already in use. Please choose another."],
          },
        };
      }
    }

    // --- Database Transaction ---
    let newOrganization;
    try {
      newOrganization = await db.$transaction(async (tx) => {
        // 1. Create the Organization
        const org = await tx.organization.create({
          data: {
            id: uuid(),
            name,
            slug,
            // logo: null, // Set later if needed
            createdAt: new Date(),
            // metadata: {}, // Add initial metadata if desired
          },
        });

        // 2. Create the initial Member record linking the creator as Admin
        await tx.member.create({
          data: {
            // id: cuid()/uuid()
            id: uuid(),
            organizationId: org.id,
            userId: userId,
            role: "ADMIN", // Assign the creator as ADMIN (use enum if applicable)
            createdAt: new Date(),
          },
        });

        // 3. Optionally: Update the user's default role or last active org? (Depends on your logic)
        // await tx.user.update({ where: { id: userId }, data: { ... }});

        return org; // Return the created organization
      });
    } catch (transactionError) {
      console.error("Transaction failed:", transactionError);
      // Handle potential errors during transaction (e.g., unique constraint violation if somehow missed)
      if (
        transactionError instanceof Prisma.PrismaClientKnownRequestError &&
        transactionError.code === "P2002"
      ) {
        // Likely a concurrent slug creation - very rare with the checks above but possible
        return {
          success: false,
          message:
            "Failed to create organization due to a conflict. Please try again.",
        };
      }
      throw transactionError; // Re-throw other errors
    }

    // --- Revalidation ---
    revalidatePath("/"); // Revalidate root or a page listing organizations
    // revalidatePath('/organizations'); // Or a specific path

    // --- Return Success ---
    return {
      success: true,
      message: `Organization "${newOrganization.name}" created successfully!`,
      data: { organizationId: newOrganization.id },
    };
  } catch (error) {
    console.error("Error creating organization:", error);
    // Generic error for unexpected issues
    return {
      success: false,
      message: "An unexpected error occurred while creating the organization.",
    };
  }
}

// import { getCurrentUser } from '@/lib/auth'; // Hypothetical auth function

// --- Schemas for Validation ---
const UpdateOrgSchema = z.object({
  id: z.string().min(1, "Organization ID is required"),
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  // Add logo validation if handling uploads (more complex)
});

const InviteMemberSchema = z.object({
  organizationId: z.string().min(1),
  email: z.string().email("Invalid email address"),
  role: z.nativeEnum(UserRole), // Use nativeEnum for Prisma enums
});

const UpdateMemberRoleSchema = z.object({
  memberId: z.string().min(1),
  role: z.nativeEnum(UserRole),
});

const BanMemberSchema = z.object({
  userId: z.string().min(1),
  memberId: z.string().min(1), // Needed to revalidate member specific data if necessary
  banReason: z
    .string()
    .min(5, "Ban reason must be at least 5 characters")
    .optional()
    .nullable(),
});

const UnbanMemberSchema = z.object({
  userId: z.string().min(1),
  memberId: z.string().min(1),
});

// --- Helper: Simulate Authorization (Replace with real auth check) ---
async function checkAdminAuthorization(orgId: string): Promise<boolean> {
  // const user = await getCurrentUser();
  // if (!user || user.role !== 'ADMIN') return false;
  // // Optional: Check if user is admin *of this specific organization*
  // const membership = await db.member.findFirst({ where: { userId: user.id, organizationId: orgId } });
  // return membership?.role === 'ADMIN'; // Or check UserRole enum directly if using that
  console.log(`Authorization check for org: ${orgId}`); // Placeholder
  return true; // Assume authorized for this example
}

// --- Actions ---

export async function updateOrganizationSettings(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const orgId = formData.get("id") as string;
    // --- Authorization ---
    // if (!await checkAdminAuthorization(orgId)) {
    //   return { success: false, message: "Unauthorized" };
    // }
    // --- Validation ---
    const validatedFields = UpdateOrgSchema.safeParse({
      id: orgId,
      name: formData.get("name"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Validation failed.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { id, name } = validatedFields.data;
    // Add logo handling here (upload to storage, get URL) if implemented

    await db.organization.update({
      where: { id },
      data: { name /*, logo: logoUrl */ },
    });

    revalidatePath("/admin"); // Revalidate the admin page
    return { success: true, message: "Organization updated successfully." };
  } catch (error) {
    console.error("Error updating organization:", error);
    return { success: false, message: "Failed to update organization." };
  }
}

export async function inviteMember(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const orgId = formData.get("organizationId") as string;
    // --- Authorization ---
    // if (!await checkAdminAuthorization(orgId)) {
    //    return { success: false, message: "Unauthorized" };
    // }

    // --- Validation ---
    const validatedFields = InviteMemberSchema.safeParse({
      organizationId: orgId,
      email: formData.get("email"),
      role: formData.get("role"), // This will be a string from the form
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Validation failed.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { organizationId, email, role } = validatedFields.data;

    // --- Check if user exists, check if already invited/member ---
    const existingUser = await db.user.findUnique({ where: { email } });
    const existingInvitation = await db.invitation.findFirst({
      where: { email, organizationId },
    });
    const existingMember = existingUser
      ? await db.member.findFirst({
          where: { userId: existingUser.id, organizationId },
        })
      : null;

    if (existingMember) {
      return {
        success: false,
        message: "User is already a member of this organization.",
      };
    }
    if (existingInvitation && existingInvitation.status === "PENDING") {
      return {
        success: false,
        message: "User already has a pending invitation.",
      };
    }
    // --- Create Invitation ---
    // const inviter = await getCurrentUser(); // Get current admin user
    // if (!inviter) return { success: false, message: "Inviter not found." };

    await db.invitation.create({
      data: {
        organizationId,
        email,
        role: role.toString(), // Store role as string, consistent with schema
        status: "PENDING",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiration
        inviterId: "clerk_or_auth0_user_id", // Replace with actual inviter user ID from your auth
        // inviterId: inviter.id
      },
    });

    // TODO: Send invitation email

    revalidatePath("/admin");
    return { success: true, message: `Invitation sent to ${email}.` };
  } catch (error) {
    console.error("Error inviting member:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors if needed
    }
    return { success: false, message: "Failed to send invitation." };
  }
}

export async function updateMemberRole(
  data: z.infer<typeof UpdateMemberRoleSchema>
): Promise<ActionResponse> {
  try {
    // --- Validation ---
    const validatedFields = UpdateMemberRoleSchema.safeParse(data);
    if (!validatedFields.success) {
      return { success: false, message: "Invalid data." };
    }

    const { memberId, role } = validatedFields.data;

    const member = await db.member.findUnique({
      where: { id: memberId },
      include: { organization: true, user: true },
    });
    if (!member) {
      return { success: false, message: "Member not found." };
    }

    // --- Authorization ---
    //  if (!await checkAdminAuthorization(member.organizationId)) {
    //     return { success: false, message: "Unauthorized" };
    //  }

    // Prevent demoting the last admin (add more robust logic if needed)
    if (member.role === "ADMIN" || member.user.role === UserRole.ADMIN) {
      // Check both member role string and User role enum
      const adminCount = await db.member.count({
        where: { organizationId: member.organizationId, role: "ADMIN" }, // Assuming 'ADMIN' string role
      });
      if (adminCount <= 1 && role !== UserRole.ADMIN) {
        return { success: false, message: "Cannot remove the last admin." };
      }
    }

    await db.member.update({
      where: { id: memberId },
      data: { role: role.toString() }, // Update string role in Member model
    });

    // Also update the role on the User model if your logic requires it
    await db.user.update({
      where: { id: member.userId },
      data: { role: role }, // Update enum role in User model
    });

    revalidatePath("/admin");
    return { success: true, message: "Member role updated." };
  } catch (error) {
    console.error("Error updating member role:", error);
    return { success: false, message: "Failed to update member role." };
  }
}

export async function banMember(
  data: z.infer<typeof BanMemberSchema>
): Promise<ActionResponse> {
  try {
    const validatedFields = BanMemberSchema.safeParse(data);
    if (!validatedFields.success) {
      return { success: false, message: "Invalid data provided." };
    }
    const { userId, banReason } = validatedFields.data;

    const member = await db.member.findFirst({
      where: { userId },
      include: { organization: true },
    });
    if (!member) {
      return { success: false, message: "Member not found." };
    }

    // --- Authorization ---
    // if (!await checkAdminAuthorization(member.organizationId)) {
    //     return { success: false, message: "Unauthorized" };
    // }

    // Prevent banning self or other admins (adjust logic as needed)
    // const currentUser = await getCurrentUser();
    // if (member.userId === currentUser?.id) {
    //     return { success: false, message: "Cannot ban yourself." };
    // }
    // if (member.role === 'ADMIN') {
    //     return { success: false, message: "Cannot ban an administrator." };
    // }

    await db.user.update({
      where: { id: userId },
      data: {
        banned: true,
        banReason: banReason ?? "No reason provided.",
        banExpires: null, // Set expiration logic if needed
        isActive: false, // Optionally deactivate the user system-wide
      },
    });

    revalidatePath("/admin");
    return { success: true, message: "Member banned successfully." };
  } catch (error) {
    console.error("Error banning member:", error);
    return { success: false, message: "Failed to ban member." };
  }
}

export async function unbanMember(
  data: z.infer<typeof UnbanMemberSchema>
): Promise<ActionResponse> {
  try {
    const validatedFields = UnbanMemberSchema.safeParse(data);
    if (!validatedFields.success) {
      return { success: false, message: "Invalid data." };
    }
    const { userId } = validatedFields.data;

    const member = await db.member.findFirst({
      where: { userId },
      include: { organization: true },
    });
    if (!member) {
      return { success: false, message: "Member not found." };
    }

    // --- Authorization ---
    // if (!await checkAdminAuthorization(member.organizationId)) {
    //     return { success: false, message: "Unauthorized" };
    // }

    await db.user.update({
      where: { id: userId },
      data: {
        banned: false,
        banReason: null,
        banExpires: null,
        isActive: true, // Reactivate if previously deactivated
      },
    });

    revalidatePath("/admin");
    return { success: true, message: "Member unbanned successfully." };
  } catch (error) {
    console.error("Error unbanning member:", error);
    return { success: false, message: "Failed to unban member." };
  }
}

// --- Fetch Actions (called directly from page/components) ---

export async function getOrganizationData(orgId: string) {
  // Add auth check if needed
  return await db.organization.findUnique({
    where: { id: orgId },
  });
}

export async function getOrganizationMembers(orgId: string) {
  // Add auth check if needed
  return await db.member.findMany({
    where: { organizationId: orgId },
    include: {
      user: {
        // Include related user data
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          banned: true,
          banReason: true,
          role: true, // User's base role
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getAuditLogs(orgId: string, limit = 50) {
  // Add auth check if needed
  // Note: Your AuditLog model has tenantId, ensure it matches orgId concept
  return await db.auditLog.findMany({
    where: { tenantId: orgId }, // Assuming tenantId corresponds to organizationId
    take: limit,
    orderBy: { performedAt: "desc" },
    include: {
      user: {
        // Assuming relation exists from AuditLog to Member
        select: { user: { select: { name: true, email: true } } }, // Get user details via member
      },
    },
  });
}
