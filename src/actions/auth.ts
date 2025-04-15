import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import redis from "@/lib/redis";
import { headers } from "next/headers";


// Cache TTL constants
const AUTH_CONTEXT_TTL = 1800; // 30 minutes
const AUTHORIZATION_TTL = 3600; // 60 minutes (longer TTL since org membership changes less frequently)

async function getServerAuthContext(): Promise<{
  userId: string;
  organizationId: string;
}> {
  const headersList = await headers();
  const cacheKey = `auth:context`;

  try {
    // Try to get from cache first
    const cachedAuthContext = await redis.get(cacheKey);
    if (cachedAuthContext) {
      return cachedAuthContext as {
        userId: string;
        organizationId: string;
      };
    }

    // If not in cache, fetch from auth service
    const session = await auth.api.getSession({ headers: headersList });
    
    if (!session?.user?.id ) {
      throw new Error("Unauthorized - No user ID found in session.");
    }

    let activeOrgId = session.session.activeOrganizationId;
    
    if(!activeOrgId) {
      const org = await db.user.findUnique({
        where: { id: session.user.id },
        select: { activeOrganizationId: true },
      });
      activeOrgId = org?.activeOrganizationId;
    }

    const authContext = {
      userId: session.user.id,
      organizationId: activeOrgId || "",
    };

    // Cache the result
    await redis.setex(cacheKey, AUTH_CONTEXT_TTL, authContext);

    return authContext;
  } catch (error) {
    console.error("Error in getServerAuthContext:", error);
    throw error;
  }
}

async function checkUserAuthorization(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const cacheKey = `auth:membership:${userId}:${organizationId}`;

  try {
    // Try to get from cache first
    const cachedResult = await redis.get(cacheKey);
    if (typeof cachedResult === 'boolean') {
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
  type: 'context' | 'membership',
  identifier: string,
  organizationId?: string
): Promise<void> {
  try {
    if (type === 'context') {
      const cacheKey = `auth:context:${identifier}`;
      await redis.del(cacheKey);
    } else if (type === 'membership') {
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

