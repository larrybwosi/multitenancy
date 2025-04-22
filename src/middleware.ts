import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Define the array of public paths that should NOT run the auth check
const publicPaths = ["/sign-in", "/api/auth", "/about", "/"];

export default async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname;

  const isPublicPath = publicPaths.some(
    (path) =>
      currentPath === path ||
      (path.endsWith("/") && currentPath.startsWith(path))
  );

  // If the path is public, skip authentication and proceed
  if (isPublicPath) {
    return NextResponse.next();
  }

  // --- If the path is NOT public, perform the authentication check ---
  const session = getSessionCookie(request);
  console.log("Session:", session); // Debugging: Log the session object

  // If there's no session, redirect to the sign-in page
  if (!session) {
    // Optionally, add the intended destination as a callbackUrl query parameter
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", request.url); // Redirect back after login
    return NextResponse.redirect(signInUrl);
  }

  // If there is a session, allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};