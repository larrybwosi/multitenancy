import {  InvitationStatus, MemberRole, Prisma } from "@prisma/client";
import crypto from "crypto";
import prisma from '@/lib/db'
import { getServerAuthContext } from "./auth";
import { createNotification } from "./notifications";
// Assume email sending function exists
// async function sendInvitationEmail(email: string, token: string, organizationName: string): Promise<void> { ... }

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
  const { userId, organizationId } = await getServerAuthContext();
  try {
    // 1. Check if inviter is part of the organization (optional but recommended)
    const inviterMembership = await prisma.member.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });
    // Add permission check here if needed (e.g., only ADMIN/OWNER can invite)
    if (
      !inviterMembership /* || !hasInvitePermission(inviterMembership.role) */
    ) {
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
        inviterId:userId,
        email: inviteeEmail,
        role,
        token,
        expiresAt,
        status: InvitationStatus.PENDING, // Default, but explicit is fine
      },
      include: {
        // Include organization details for the email
        organization: { select: { name: true } },
      },
    });

    // 6. Send the invitation email (Side Effect - outside the DB transaction)
    // Build the accept URL using the token (e.g., https://yourapp.com/accept-invite?token=...)
    // await sendInvitationEmail(inviteeEmail, token, newInvitation.organization.name);
    console.log(
      `INFO: Invitation created. Token: ${token}. Email not sent (implement sendInvitationEmail).`
    );

    await createNotification({
      userId: userId,
      type: "INVITATION",
      title: `Invitation by ${inviterMembership?.name}`,
      body: `You have been invited to join ${newInvitation.organization.name}.`,
      // metadata: {
      //   organizationId,
      //   invitationId: newInvitation.id,
      //   role,
      // },
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
      select: { email: true }, // Select only needed fields
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