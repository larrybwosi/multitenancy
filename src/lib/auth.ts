import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, multiSession, openAPI, organization, username } from "better-auth/plugins";
import { db } from "./db";
// import { member, myCustomRole, owner, ac } from "./organisation/permisions";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL,
  token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN,
});


export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    "http://localhost:3000",
    "https://cheapcity.vercel.app",
    "https://www.cheapcity.vercel.app",
    "http://192.168.137.56:3000",
  ],
  appName: "Clevery POS",
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  session: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const org = await db.user.findUnique({where:{id: session.userId}})
          console.log(org)
          const activeOrganizationId = org?.activeOrganizationId;
          return {
            data: {
              ...session,
              activeOrganizationId,
            },
          };
        },
      },
    },
  },
  plugins: [
    admin({
      adminRoles: ["admin", "superadmin", "owner", "developer"],
      defaultRole: "cashier",
      defaultBanReason: "Miss behaving",
    }),
    username(),
    openAPI(),
    multiSession({
      maximumSessions: 8,
    }),

    organization(),
  ],

  secondaryStorage: {
    get: async (key) => {
      const value = (await redis.get(key)) as string | null;
      return value ? value : null;
    },
    set: async (key, value, ttl) => {
      if (ttl) await redis.set(key, value, { ex: ttl });
      else await redis.set(key, value);
    },
    delete: async (key) => {
      await redis.del(key);
    },
  },
  rateLimit: {
    window: 60, // time window in seconds
    max: 100, // max requests in the window
    storage: "secondary-storage",
  },
});
