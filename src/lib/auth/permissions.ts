// lib/permissions.ts
import { MemberRole } from "@prisma/client";
import {db as prisma} from "../db";

/**
 * Checks if a user is authenticated.
 * Throws an error if not authenticated.
 * @param session The user session object.
 */
export function ensureAuthenticated(
  session: Session | null
): asserts session is Session & { user: { id: string } } {
  if (!session?.user?.id) {
    throw new Error("Authentication required."); // Or a custom AuthenticationError
  }
}

/**
 * Fetches the role of a user within a specific organization.
 * @param userId The ID of the user.
 * @param organizationId The ID of the organization.
 * @returns The MemberRole or null if the user is not a member.
 */
export async function getUserRoleInOrganization(
  userId: string,
  organizationId: string
): Promise<MemberRole | null> {
  if (!userId || !organizationId) {
    return null;
  }
  try {
    const membership = await prisma.member.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      select: {
        role: true,
      },
    });
    // Cast the role string from DB to MemberRole enum
    return membership?.role as MemberRole | null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null; // Or rethrow if critical
  }
}

/**
 * Checks if a user can read (view) an organization's details.
 * Currently allows any member.
 * @param userId The ID of the user.
 * @param organizationId The ID of the organization.
 * @returns True if the user can read the organization, false otherwise.
 */
export async function canReadOrganization(
  userId: string | undefined,
  organizationId: string
): Promise<boolean> {
  if (!userId) return false;
  const role = await getUserRoleInOrganization(userId, organizationId);
  // Any member can read (OWNER, ADMIN, STAFF, VIEWER)
  return role !== null;
}

/**
 * Checks if a user can update an organization's details.
 * Requires ADMIN or OWNER role.
 * @param userId The ID of the user.
 * @param organizationId The ID of the organization.
 * @returns True if the user can update the organization, false otherwise.
 */
export async function canUpdateOrganization(
  userId: string | undefined,
  organizationId: string
): Promise<boolean> {
  if (!userId) return false;
  const role = await getUserRoleInOrganization(userId, organizationId);
  return role === MemberRole.ADMIN || role === MemberRole.OWNER;
}

/**
 * Checks if a user can delete an organization.
 * Requires OWNER role.
 * @param userId The ID of the user.
 * @param organizationId The ID of the organization.
 * @returns True if the user can delete the organization, false otherwise.
 */
export async function canDeleteOrganization(
  userId: string | undefined,
  organizationId: string
): Promise<boolean> {
  if (!userId) return false;
  const role = await getUserRoleInOrganization(userId, organizationId);
  return role === MemberRole.OWNER;
}

/**
 * Checks if a user can manage members (invite, remove, change roles).
 * Requires ADMIN or OWNER role.
 * @param userId The ID of the user.
 * @param organizationId The ID of the organization.
 * @returns True if the user can manage members, false otherwise.
 */
export async function canManageMembers(
  userId: string | undefined,
  organizationId: string
): Promise<boolean> {
  if (!userId) return false;
  const role = await getUserRoleInOrganization(userId, organizationId);
  return role === MemberRole.ADMIN || role === MemberRole.OWNER;
}
