import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, multiSession, openAPI, organization, username } from "better-auth/plugins";
import { db } from "./db";
import { UserRole } from "@prisma/client";
import { ac, ADMIN, CASHIER, DEVELOPER } from "./auth/permissions";
import redis from "./redis";


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
      maxAge: 5 * 60,
    },
    preserveSessionInDatabase: true,
  },
  // databaseHooks: {
  //   session: {
  //     create: {
  //       before: async (session) => {
  //         const user = await db.user.findUnique({
  //           where: { id: session.userId },
  //         });
  //         const activeOrganizationId = user?.activeOrganizationId;
  //         return {
  //           data: {
  //             ...session,
  //             activeOrganizationId,
  //           },
  //         };
  //       },
  //     },
  //   },
  // },
  plugins: [
    admin({
      adminRoles: [UserRole.ADMIN],
      defaultRole: UserRole.EMPLOYEE,
      defaultBanReason: "Miss behaving",
      ac,
      roles: {
        ADMIN,
        CASHIER,
        DEVELOPER,
      },
    }),
    username(),
    openAPI(),
    multiSession({
      maximumSessions: 8,
    }),

    organization({
      allowUserToCreateOrganization: async (user) => {
        console.log(user);
        return true;
      },
      creatorRole: UserRole.ADMIN,
    }),
  ],

  // secondaryStorage: {
  //   get: async (key) => {
  //     const value = await redis.get(key) as string | null;
  //     console.log(value);
  //     return value ? value : null;
  //   },
  //   set: async (key, value, ttl) => {
  //     if (ttl) await redis.set(key, value, { ex: ttl });
  //     else await redis.set(key, value);
  //   },
  //   delete: async (key) => {
  //     await redis.del(key);
  //   },
  // },
  rateLimit: {
    window: 60,
    max: 100,
    storage: "secondary-storage",
  },
});
