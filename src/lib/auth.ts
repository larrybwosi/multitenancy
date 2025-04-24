import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { multiSession, username } from "better-auth/plugins";
import { db } from "./db";
import redis from "./redis";
import { passkey } from "better-auth/plugins/passkey";
import { nextCookies } from "better-auth/next-js";


export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  appName: "Dealio POS",
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
      maxAge: 5 * 60 * 60,
    },
    preserveSessionInDatabase: true,
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await db.user.findUnique({
            where: { id: session.userId },
          });
          const activeOrganizationId = user?.activeOrganizationId;
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
    username(),
    multiSession(),
    passkey({
      rpID: "localhost", // Use 'localhost' for local development
      rpName: "Dealio POS",
      origin: "http://localhost:3000", // Use 'http://localhost:3000' for local development
      // Optional authenticator selection criteria
      authenticatorSelection: {
        // Determines the type of authenticator
        authenticatorAttachment: "platform", // 'platform' or 'cross-platform'
        // Controls credential storage behavior
        residentKey: "preferred", // 'required', 'preferred', or 'discouraged'
        // Controls biometric/PIN verification
        userVerification: "preferred", // 'required', 'preferred', or 'discouraged'
      },
    }),
    nextCookies(),
  ],

  secondaryStorage: {
    get: async (key) => {
      const value = (await redis.get(key)) as string | null;
      return value ? value : null;
    },
    set: async (key, value, ttl) => {
      if (ttl) await redis.setex(key, ttl, value);
      else await redis.set(key, value);
    },
    delete: async (key) => {
      await redis.del(key);
    },
  },
  rateLimit: {
    window: 60,
    max: 100,
    storage: "secondary-storage",
  },
});
