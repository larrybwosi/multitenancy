// src/app/invite/[token]/page.tsx
import { redirect } from "next/navigation";
import { getInvitationDetails } from "@/actions/invitations"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // For showing errors
import { Terminal } from "lucide-react";
import InvitationAcceptCard from "../componnts/invitation-accept-card";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    // If not logged in, redirect to login, possibly passing the invite token
    // so they can be redirected back here after login.
    const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`;
    redirect(loginUrl);
  }

  const loggedInUserId = session.user.id;

  // Fetch invitation details using the server action helper
  const result = await getInvitationDetails(token);

  // Handle errors fetching the invitation or if it's invalid/expired/processed
  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-100 p-4">
        <Alert variant="destructive" className="max-w-md">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Invitation Error</AlertTitle>
          <AlertDescription>
            {result.error || "Could not load invitation details."}
            {/* Optionally add a button to go home */}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Render the client component with the necessary data
  return (
    <InvitationAcceptCard
      invitation={result.data}
      loggedInUserId={loggedInUserId}
    />
  );
}
