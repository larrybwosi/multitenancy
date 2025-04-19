'use server'
import { InvitationStatus, MemberRole, NotificationType, Prisma } from "@prisma/client";
import crypto from "crypto";
import prisma from '@/lib/db'
import { getServerAuthContext } from "./auth";
import { createNotification } from "./notifications";
import { hasMemberPermission } from "@/lib/auth/organisation/authorizations";
import { sendInvitationEmail } from "./emails";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
// Assume email sending function exists


// Define expiry duration (e.g., 7 days)
const INVITATION_EXPIRY_DAYS = 7;

interface CreateInvitationArgs {
  inviteeEmail: string; // Email of the person being invited
  role: MemberRole; // Role to assign upon acceptance
}

export async function createInvitation({
  inviteeEmail,
  role,
}: CreateInvitationArgs) {
  const { userId, organizationId, role: inviterRole } = await getServerAuthContext();
  try {
    
    const session = await auth.api.getSession({ headers: await headers() });
    // 1. Check if inviter is part of the organization (optional but recommended)
    const inviterMembership = await prisma.member.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
      include: {
        organization: { select: { name: true } },
        user: { select: { name: true, email: true } }
      }
    });
    // Add permission check here if needed (e.g., only ADMIN/OWNER can invite)
    if (!inviterMembership || inviterRole && !hasMemberPermission(inviterRole, "invite_members")) {
      console.log("Inviter does not belong to this organization or lacks permission.");
      return {
        error:
          "Inviter does not belong to this organization or lacks permission.",
      };
    }

    // 2. Check if the email belongs to an existing member of the organization
    const existingMember = await prisma.member.findFirst({
      where: {
        organizationId: organizationId,
        user: {
          email: inviteeEmail,
        },
      },
    });
    if (existingMember) {
      console.log("This email address already belongs to a member of this organization.");
      return {
        error:
          "This email address already belongs to a member of this organization.",
      };
    }

    // 3. Check for existing *pending* invitation for the same email/org
    const existingPendingInvite = await prisma.invitation.findFirst({
      where: {
        organizationId: organizationId,
        email: inviteeEmail,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() }, // Only consider non-expired ones
      },
    });
    if (existingPendingInvite) {
      // Optional: Resend email for existing pending invite instead of erroring
      console.log("An active pending invitation already exists for this email address.");
      // Delete the old invitation if needed (optional)
      // await prisma.invitation.delete({ where: { id: existingPendingInvite.id } });
      return {
        error:
          "An active pending invitation already exists for this email address.",
      };
    }

    // 4. Generate unique token and expiry date
    const token = crypto.randomBytes(32).toString("hex"); // Generate secure random token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    // 5. Create the invitation record
    const newInvitation = await prisma.invitation.create({
      data: {
        organizationId,
        inviterId: userId,
        email: inviteeEmail,
        role,
        token,
        expiresAt,
        status: InvitationStatus.PENDING, // Default, but explicit is fine
      },
      include: {
        // Include organization details for the email
        organization: { select: { name: true, slug: true } },
      },
    });

    // 6. Send the invitation email (Side Effect - outside the DB transaction)
    // Build the accept URL using the token (e.g., https://yourapp.com/accept-invite?token=...)
    const acceptUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/invitation/${token}`;
    console.log(`Invitation URL: ${acceptUrl}`); // For debugging, remove in production
    await sendInvitationEmail(inviteeEmail, token, newInvitation.organization.name, session?.user.name || '');
    // Note: In production, handle email sending errors gracefully

    // 7. Create a notification for the invited user
    await createNotification(prisma, {
      type: NotificationType.INVITATION,
      title: `Invitation to join ${inviterMembership.organization.name}`,
      description: `${inviterMembership.user.name || inviterMembership.user.email} has invited you to join ${inviterMembership.organization.name} as a ${role.toLowerCase()}.`,
      recipientEmail: inviteeEmail,
      link: acceptUrl,
      senderId: userId,
      details: {
        organizationId,
        organizationName: inviterMembership.organization.name,
        inviterName: inviterMembership.user.name || inviterMembership.user.email,
        role,
        token
      }
    });

    return { success: true, data: newInvitation };
  } catch (error) {
    console.error("Error creating invitation:", error);
    // Use a more specific error handler if available
    return {
      error: "An unexpected error occurred while creating the invitation.",
    };
  }
}

export async function getInvitationDetails(token: string) {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            description: true,
            createdAt: true,
          },
        },
        inviter: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!invitation) {
      return {
        success: false,
        error: "Invalid invitation token",
        code: "INVITATION_NOT_FOUND",
      };
    }

    if (invitation.status !== "PENDING") {
      return {
        success: false,
        error: `This invitation has already been ${invitation.status.toLowerCase()}`,
        code: "INVITATION_EXPIRED",
        status: invitation.status,
      };
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return {
        success: false,
        error: "This invitation has expired",
        code: "INVITATION_EXPIRED",
        expiredAt: invitation.expiresAt,
      };
    }

    // Transform the data for better client consumption
    const formattedInvitation = {
      id: invitation.id,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      organization: {
        id: invitation.organization.id,
        name: invitation.organization.name,
        slug: invitation.organization.slug,
        logo: invitation.organization.logo,
        description: invitation.organization.description,
        createdDate: invitation.organization.createdAt,
      },
      inviter: {
        id: invitation.inviter.id,
        name: invitation.inviter.name,
        email: invitation.inviter.email,
        avatar: invitation.inviter.image,
      },
    };

    return {
      success: true,
      data: formattedInvitation,
      meta: {
        isValid: true,
        expiresIn:
          Math.floor(
            (new Date(invitation.expiresAt).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          ) + " days",
      },
    };
  } catch (error) {
    console.error("Error fetching invitation details:", error);

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return {
        success: false,
        error: "Database error occurred while fetching invitation",
        code: "DATABASE_ERROR",
        prismaCode: error.code,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred while fetching invitation details.",
      code: "UNKNOWN_ERROR",
    };
  }
}

interface AcceptInvitationArgs {
  token: string;
  acceptingUserId: string; // ID of the user accepting the invite (must be logged in)
}

export async function acceptInvitation({
  token,
  acceptingUserId,
}: AcceptInvitationArgs) {
  try {
    // 1. Find the invitation by token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: { select: { name: true } },
        inviter: { select: { id: true, name: true, email: true } }
      }
    });

    // 2. Validate the invitation
    if (!invitation) {
      return { error: "Invalid invitation token." };
    }
    if (invitation.status !== InvitationStatus.PENDING) {
      // Handle already accepted/declined/expired based on status
      return {
        error: `This invitation is already ${invitation.status.toLowerCase()}.`,
      };
    }
    if (invitation.expiresAt < new Date()) {
      // Optionally update status to EXPIRED here if needed
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      return { error: "This invitation has expired." };
    }

    // 3. Get the accepting user's details (especially email for optional check)
    const acceptingUser = await prisma.user.findUnique({
      where: { id: acceptingUserId },
      select: { email: true, name: true }, // Select only needed fields
    });

    if (!acceptingUser) {
      // Should not happen if user is authenticated, but good practice
      return { error: "Accepting user not found." };
    }

    // Optional but Recommended: Check if logged-in user's email matches invite email
    if (acceptingUser.email !== invitation.email) {
      console.warn(
        `Invitation email mismatch: Invite for ${invitation.email}, accepted by ${acceptingUser.email} (User ID: ${acceptingUserId})`
      );
      // Decide policy: error out, or allow acceptance but maybe log it?
      // return { error: "This invitation was sent to a different email address." };
    }

    // 4. Check if the user is *already* a member of this organization
    const existingMembership = await prisma.member.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invitation.organizationId,
          userId: acceptingUserId,
        },
      },
    });

    if (existingMembership) {
      // User is already a member, maybe just mark invite as accepted?
      // Or inform the user they are already a member.
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED }, // Still mark as accepted
      });
      return { error: "You are already a member of this organization." };
    }

    // 5. Perform acceptance within a transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Update invitation status
      const updatedInvitation = await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: InvitationStatus.ACCEPTED },
      });

      // Add user to the organization as a member
      const newMember = await tx.member.create({
        data: {
          userId: acceptingUserId,
          organizationId: invitation.organizationId,
          role: invitation.role, // Assign role from invitation
        },
      });

      // Optional: Update user's active organization or other user fields
      await tx.user.update({
        where: { id: acceptingUserId },
        data: { activeOrganizationId: invitation.organizationId }
      });

      return { updatedInvitation, newMember };
    });

    // 6. Create notifications after successful transaction
    
    // Notify the user who sent the invitation
    if (invitation.inviter) {
      await createNotification(prisma, {
        type: NotificationType.INVITATION_ACCEPTED,
        title: `Invitation accepted`,
        description: `${acceptingUser.name || acceptingUser.email} has accepted your invitation to join ${invitation.organization.name}.`,
        userId: invitation.inviterId,
        details: {
          organizationId: invitation.organizationId,
          organizationName: invitation.organization.name,
          acceptingUserName: acceptingUser.name || acceptingUser.email,
        }
      });
    }

    // Notify organization admins (optional)
    const orgAdmins = await prisma.member.findMany({
      where: {
        organizationId: invitation.organizationId,
        role: { in: [MemberRole.OWNER, MemberRole.ADMIN] },
        userId: { not: invitation.inviterId } // Don't notify the inviter twice
      },
      select: { userId: true }
    });

    // Create notifications for each admin
    for (const admin of orgAdmins) {
      await createNotification(prisma, {
        type: NotificationType.NEW_MEMBER,
        title: `New member joined`,
        description: `${acceptingUser.name || acceptingUser.email} has joined ${invitation.organization.name} as a ${invitation.role.toLowerCase()}.`,
        userId: admin.userId,
        details: {
          organizationId: invitation.organizationId,
          organizationName: invitation.organization.name,
          newMemberName: acceptingUser.name || acceptingUser.email,
          newMemberRole: invitation.role
        }
      });
    }

    // Confirmation notification to the user who just joined
    await createNotification(prisma, {
      type: NotificationType.WELCOME,
      title: `Welcome to ${invitation.organization.name}`,
      description: `You've successfully joined ${invitation.organization.name} as a ${invitation.role.toLowerCase()}.`,
      userId: acceptingUserId,
      details: {
        organizationId: invitation.organizationId,
        organizationName: invitation.organization.name,
        role: invitation.role
      }
    });

    return { success: true, data: transactionResult.newMember };
  } catch (error) {
    console.error("Error accepting invitation:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle potential unique constraint errors if transaction wasn't used correctly
      if (error.code === "P2002") {
        return {
          error:
            "Failed to accept invitation. Potential duplicate membership detected.",
        };
      }
    }
    // Use a more specific error handler if available
    return {
      error: "An unexpected error occurred while accepting the invitation.",
    };
  }
}

export async function declineInvitation({
  token,
  userId,
}: {
  token: string;
  userId: string;
}) {
  try {
    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: { select: { name: true } },
        inviter: { select: { id: true, name: true, email: true } }
      }
    });

    if (!invitation) {
      return { error: "Invalid invitation token." };
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return {
        error: `This invitation is already ${invitation.status.toLowerCase()}.`,
      };
    }

    // Get the declining user's details
    const decliningUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!decliningUser) {
      return { error: "User not found." };
    }

    // Update invitation status
    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: InvitationStatus.DECLINED },
    });

    // Notify the inviter
    if (invitation.inviter) {
      await createNotification(prisma, {
        type: NotificationType.INVITATION_DECLINED,
        title: `Invitation declined`,
        description: `${decliningUser.name || decliningUser.email} has declined your invitation to join ${invitation.organization.name}.`,
        userId: invitation.inviterId,
        details: {
          organizationId: invitation.organizationId,
          organizationName: invitation.organization.name,
          decliningUserName: decliningUser.name || decliningUser.email,
        }
      });
    }

    return { success: true, data: updatedInvitation };
  } catch (error) {
    console.error("Error declining invitation:", error);
    return {
      error: "An unexpected error occurred while declining the invitation.",
    };
  }
}