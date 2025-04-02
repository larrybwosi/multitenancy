import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  customSessionClient,
  passkeyClient,
  organizationClient,
} from "better-auth/client/plugins";
import { auth } from ".";
import { redirect } from "next/navigation";
import { ac, owner, member, myCustomRole } from "./organisation/permisions";

export const { signIn, signUp, useSession, signOut, admin, changePassword, organization } =
  createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
    plugins: [
      customSessionClient<typeof auth>(),
      adminClient(),
      passkeyClient(),
      organizationClient({
        ac,
        roles: {
          owner,
          member,
          myCustomRole,
        },
      }),
    ],
    fetchOptions: {
      onError: async (context) => {
        const { response } = context;
        if (response.status === 429) {
          const retryAfter = response.headers.get("X-Retry-After");
          console.log(`Rate limit exceeded. Retry after ${retryAfter} seconds`);
          redirect("/too-fast");
        }
      },
    },
  });
