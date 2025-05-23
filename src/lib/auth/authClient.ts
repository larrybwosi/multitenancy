import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  apiKeyClient,
  customSessionClient,
  organizationClient,
} from "better-auth/client/plugins";
import { auth } from "../auth";
import { ac, ADMIN, CASHIER, DEVELOPER } from "./permissions";

export const { signIn, signUp, useSession, signOut, admin, changePassword, organization, apiKey } = createAuthClient({
  baseURL: process.env.BETTER_AUTH_ENDPOINT,
  basePath:process.env.BETTER_AUTH_ENDPOINT,
  plugins: [
    customSessionClient<typeof auth>(),
    apiKeyClient(),
    adminClient({
      ac,
      roles: {
        ADMIN,
        CASHIER,
        DEVELOPER,
      },
    }),
    organizationClient(),
  ],
});
