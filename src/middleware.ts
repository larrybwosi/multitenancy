import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const publicPaths = new Set([
  "/sign-in",
  "/api/auth",
  "/about",
  "/api/auth/get-session",
  "/",
  "/login",
  "/sign-up/",
  "/api/auth/",
  "/about/",
  "/api/test-email",
  "/check-in",
  "/api/attendance/check-in",
  "/api/attendance/check-out",
  "/api/attendance/check-out/all",
]);

export default async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname.toLowerCase();

  const isPublicPath =
    // Exact match check
    publicPaths.has(currentPath) ||
    // Handle trailing slash variants (e.g., /about matches /about/)
    publicPaths.has(
      currentPath.endsWith("/") ? currentPath.slice(0, -1) : currentPath + "/"
    ) ||
    // Subpath check only for paths explicitly ending with /
    Array.from(publicPaths).some(
      (path) =>
        path.endsWith("/") &&
        path !== "/" && // Explicitly exclude root path from subpath matching
        currentPath.startsWith(path)
    );

  // console.log("isPublicPath: ", isPublicPath, "for path:", currentPath);

  if (isPublicPath) {
    return NextResponse.next();
  }

  const session = getSessionCookie(request);
  // console.log("session: ", session);

  if (!session) {
    if (request.nextUrl.pathname.startsWith("/api")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const signInUrl = new URL("/login", request.url);
    signInUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(signInUrl);
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
