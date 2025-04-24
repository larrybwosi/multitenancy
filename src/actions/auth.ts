'use server';

import {auth} from '@/lib/auth';
import {db} from '@/lib/db';
import redis from '@/lib/redis';
import {MemberRole} from '@prisma/client';
import {headers} from 'next/headers';
import {getMemberActiveLocation} from './attendance';

// Cache TTL constants
const AUTH_CONTEXT_TTL = 1800; // 30 minutes
const AUTHORIZATION_TTL = 3600; // 60 minutes (longer TTL since org membership changes less frequently)

interface ServerAuthContextResult {
  userId: string; // Added User ID
  memberId: string; // Member ID specific to the organization
  organizationId: string;
  role?: MemberRole;
  organizationName?: string | null;
  organizationSlug?: string | null;
  organizationDescription?: string | null;
  activeLocation?: string | null;
}

// Helper function remains the same as before
export async function getMemberAndOrgDetails(
  userId: string,
  organizationId: string
): Promise<{
  memberId: string | null;
  role?: MemberRole;
  organizationSlug?: string | null;
  organizationName?: string | null;
  organizationDescription?: string | null;
}> {
  if (!userId || !organizationId) {
    return {memberId: null};
  }

  try {
    const member = await db.member.findUnique({
      where: {
        organizationId_userId: {organizationId, userId},
      },
      select: {
        id: true,
        role: true,
        organization: {
          select: {
            slug: true,
            description: true,
            name: true,
          },
        },
      },
    });

    if (!member) {
      return {memberId: null};
    }

    return {
      memberId: member.id,
      role: member.role,
      organizationSlug: member.organization.slug,
      organizationDescription: member.organization.description,
    };
  } catch (error) {
    console.error('Error fetching member/org details:', error);
    return {memberId: null};
  }
}

async function getServerAuthContext(): Promise<ServerAuthContextResult> {
  let sessionForCacheKey;

  try {
    sessionForCacheKey = await auth.api.getSession({
      headers: await headers(),
    });
  } catch (error) {
    //@ts-expect-error ignore
    console.error('Error fetching session for cache key:', error.message);
    // Fall back to anonymous user if session fetch fails
    sessionForCacheKey = null;
  }

  const userIdForCacheKey = sessionForCacheKey?.user?.id;
  const cacheKey = `auth:context:${userIdForCacheKey}`;

  try {
    // 1. Try cache first
    const cachedAuthContextJson = await redis.get(cacheKey);
    if (cachedAuthContextJson) {
      try {
        const cachedContext = cachedAuthContextJson as ServerAuthContextResult;
        // Validate essential fields from cache
        if (cachedContext && cachedContext.userId && cachedContext.memberId && cachedContext.organizationId) {
          return cachedContext;
        } else {
          console.warn('Invalid data found in auth context cache for key:', cacheKey);
        }
      } catch (parseError) {
        //@ts-expect-error ignore
        console.error('Error parsing cached auth context:', parseError.message);
      }
    }

    // 2. Fetch session if not in cache or cache invalid
    let session;
    try {
      session = sessionForCacheKey || (await auth.api.getSession({headers: await headers()}));
    } catch (sessionError) {
      //@ts-expect-error ignore
      console.error('Error fetching session:', sessionError.message);
      throw new Error('Failed to retrieve user session');
    }

    if (!session?.user?.id) {
      throw new Error('Unauthorized - No user ID found in session.');
    }
    const userId = session.user.id; // *** Store the userId ***

    // 3. Determine Active Organization ID
    let activeOrgId = session.session?.activeOrganizationId || null;
    if (!activeOrgId) {
      try {
        const userPrefs = await db.user.findUnique({
          where: {id: userId},
          select: {activeOrganizationId: true},
        });
        activeOrgId = userPrefs?.activeOrganizationId || null;
      } catch (dbError) {
        //@ts-expect-error ignore
        console.error('Error fetching user preferences:', dbError.message);
        activeOrgId = null;
      }
    }

    // 4. Fetch Member ID, Role, and Org Details
    let authContextData: ServerAuthContextResult;

    if (activeOrgId) {
      try {
        const details = await getMemberAndOrgDetails(userId, activeOrgId);
        if (details.memberId) {
          const activeLocation = await getMemberActiveLocation(details.memberId);
          authContextData = {
            userId: userId, // *** Include userId in the context ***
            memberId: details.memberId,
            organizationId: activeOrgId,
            role: details.role,
            organizationName: details.organizationName,
            organizationSlug: details.organizationSlug,
            organizationDescription: details.organizationDescription,
            activeLocation: activeLocation?.id,
          };
        } else {
          console.warn(
            `User ${userId} is not a member of their active organization preference ${activeOrgId} or org not found.`
          );
          throw new Error(`User is not an active member of the designated organization (ID: ${activeOrgId}).`);
        }
      } catch (detailsError) {
        console.error('Error fetching member and org details:', detailsError);
        throw new Error('Failed to retrieve member and organization details');
      }
    } else {
      console.warn(`User ${userId} has no active organization set.`);
      throw new Error('No active organization is set for the user.');
    }

    // 5. Cache the result
    try {
      await redis.setex(cacheKey, AUTH_CONTEXT_TTL, JSON.stringify(authContextData));
    } catch (cacheError) {
      console.error('Error caching auth context:', cacheError);
      // Don't throw, as we still have the auth context data to return
    }

    return authContextData;
  } catch (error: unknown) {
    //@ts-expect-error ignore
    console.error('Error in getServerAuthContext:', error.message);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while retrieving authentication context.');
  }
}

async function checkUserAuthorization(userId: string, organizationId: string): Promise<boolean> {
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
      select: {userId: true},
    });

    const isAuthorized = !!member;

    // Cache the result
    await redis.setex(cacheKey, AUTHORIZATION_TTL, isAuthorized);

    return isAuthorized;
  } catch (error) {
    console.error('Error in checkUserAuthorization:', error);
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
    console.error('Error invalidating auth cache:', error);
  }
}

export {getServerAuthContext, checkUserAuthorization, invalidateAuthCache};
