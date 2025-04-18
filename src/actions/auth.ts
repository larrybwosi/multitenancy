import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import redis from "@/lib/redis";
import { MemberRole } from "@prisma/client";
import { headers } from "next/headers";

// Cache TTL constants
const AUTH_CONTEXT_TTL = 1800; // 30 minutes
const AUTHORIZATION_TTL = 3600; // 60 minutes (longer TTL since org membership changes less frequently)

interface ServerAuthContextResult {
  userId: string; // Added User ID
  memberId: string; // Member ID specific to the organization
  organizationId: string;
  role?: MemberRole;
  organizationSlug?: string | null;
  organizationDescription?: string | null;
}

// Helper function remains the same as before
async function getMemberAndOrgDetails(
  userId: string,
  organizationId: string
): Promise<{
  memberId: string | null;
  role?: MemberRole;
  organizationSlug?: string | null;
  organizationDescription?: string | null;
}> {
  if (!userId || !organizationId) {
    return { memberId: null };
  }

  try {
    const member = await db.member.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
      select: {
        id: true,
        role: true,
        organization: {
          select: {
            slug: true,
            description: true,
          },
        },
      },
    });

    if (!member) {
      return { memberId: null };
    }

    return {
      memberId: member.id,
      role: member.role,
      organizationSlug: member.organization.slug,
      organizationDescription: member.organization.description,
    };
  } catch (error) {
    console.error("Error fetching member/org details:", error);
    return { memberId: null };
  }
}

async function getServerAuthContext(): Promise<ServerAuthContextResult> {
  const headersList = await headers();
  const sessionForCacheKey = await auth.api.getSession({
    headers: headersList,
  });
  const userIdForCacheKey = sessionForCacheKey?.user?.id || "anon"; // Use user ID in cache key
  const cacheKey = `auth:context:${userIdForCacheKey}`;

  try {
    // 1. Try cache first
    const cachedAuthContextJson = await redis.get(cacheKey);
    if (cachedAuthContextJson) {
      try {
        const cachedContext =  cachedAuthContextJson as ServerAuthContextResult;
        // Validate essential fields from cache
        if (
          cachedContext &&
          cachedContext.userId &&
          cachedContext.memberId &&
          cachedContext.organizationId
        ) {
          return cachedContext;
        } else {
          console.warn(
            "Invalid data found in auth context cache for key:",
            cacheKey
          );
        }
      } catch (parseError) {
        console.error("Error parsing cached auth context:", parseError);
      }
    }

    // 2. Fetch session if not in cache or cache invalid
    const session =
      sessionForCacheKey ||
      (await auth.api.getSession({ headers: headersList }));

    if (!session?.user?.id) {
      throw new Error("Unauthorized - No user ID found in session.");
    }
    const userId = session.user.id; // *** Store the userId ***

    // 3. Determine Active Organization ID
    let activeOrgId = session.session?.activeOrganizationId || null;
    if (!activeOrgId) {
      const userPrefs = await db.user.findUnique({
        where: { id: userId },
        select: { activeOrganizationId: true },
      });
      activeOrgId = userPrefs?.activeOrganizationId || null;
    }

    // 4. Fetch Member ID, Role, and Org Details
    let authContextData: ServerAuthContextResult;

    if (activeOrgId) {
      const details = await getMemberAndOrgDetails(userId, activeOrgId);
      if (details.memberId) {
        authContextData = {
          userId: userId, // *** Include userId in the context ***
          memberId: details.memberId,
          organizationId: activeOrgId,
          role: details.role,
          organizationSlug: details.organizationSlug,
          organizationDescription: details.organizationDescription,
        };
      } else {
        console.warn(
          `User ${userId} is not a member of their active organization preference ${activeOrgId} or org not found.`
        );
        throw new Error(
          `User is not an active member of the designated organization (ID: ${activeOrgId}).`
        );
      }
    } else {
      console.warn(`User ${userId} has no active organization set.`);
      throw new Error("No active organization is set for the user.");
    }

    // 5. Cache the result
    await redis.setex(
      cacheKey,
      AUTH_CONTEXT_TTL,
      JSON.stringify(authContextData)
    );

    return authContextData;
  } catch (error: unknown) {
    console.error("Error in getServerAuthContext:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      "An unexpected error occurred while retrieving authentication context."
    );
  }
}

async function checkUserAuthorization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const cacheKey = `auth:membership:${userId}:${organizationId}`;

  try {
    // Try to get from cache first
    const cachedResult = await redis.get(cacheKey);
    if (typeof cachedResult === "boolean") {
      return cachedResult;
    }

    // If not in cache, check database
    const member = await db.member.findUnique({
      where: {
        organizationId_userId: {
          userId,
          organizationId,
        },
      },
      select: { userId: true },
    });

    const isAuthorized = !!member;

    // Cache the result
    await redis.setex(cacheKey, AUTHORIZATION_TTL, isAuthorized);

    return isAuthorized;
  } catch (error) {
    console.error("Error in checkUserAuthorization:", error);
    return false; // Fail secure - assume unauthorized if error occurs
  }
}

async function invalidateAuthCache(
  type: "context" | "membership",
  identifier: string,
  organizationId?: string
): Promise<void> {
  try {
    if (type === "context") {
      const cacheKey = `auth:context:${identifier}`;
      await redis.del(cacheKey);
    } else if (type === "membership") {
      if (!organizationId) {
        // Invalidate all membership checks for this user
        const pattern = `auth:membership:${identifier}:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        // Invalidate specific membership check
        const cacheKey = `auth:membership:${identifier}:${organizationId}`;
        await redis.del(cacheKey);
      }
    }
  } catch (error) {
    console.error("Error invalidating auth cache:", error);
  }
}

export { getServerAuthContext, checkUserAuthorization, invalidateAuthCache };
