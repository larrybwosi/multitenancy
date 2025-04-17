// import { NextRequest, NextResponse } from "next/server";
// import { headers } from "next/headers";
// import { auth } from "@/lib/auth"; // Ensure this path is correct for your auth setup

// // Define the array of public paths that should NOT run the auth check
// const publicPaths = [
//   "/sign-in",
//   "/api/auth", // Example: Authentication API routes might need to be public
//   "/about", // Example: An about page
//   "/", // Example: The homepage
//   // Add any other paths that should be accessible without logging in
// ];

// export default async function middleware(request: NextRequest) {
//   const currentPath = request.nextUrl.pathname;

//   // --- Check if the path is public ---
//   // Check if the current path starts with any of the public paths.
//   // This handles exact matches and cases where a whole directory should be public (e.g., '/api/auth/*').
//   const isPublicPath = publicPaths.some(
//     (path) =>
//       currentPath === path ||
//       (path.endsWith("/") && currentPath.startsWith(path))
//   );

//   // If the path is public, skip authentication and proceed
//   if (isPublicPath) {
//     return NextResponse.next();
//   }

//   // --- If the path is NOT public, perform the authentication check ---
//   // Note: Using headers() might cause issues in edge runtime. Ensure 'nodejs' runtime is suitable.
//   const session = await auth.api.getSession({
//     headers: await headers(),
//   });
//   console.log("Session:", session); // Debugging: Log the session object

//   // If there's no session, redirect to the sign-in page
//   if (!session) {
//     // Optionally, add the intended destination as a callbackUrl query parameter
//     const signInUrl = new URL("/sign-in", request.url);
//     signInUrl.searchParams.set("callbackUrl", request.url); // Redirect back after login
//     return NextResponse.redirect(signInUrl);
//   }

//   // If there is a session, allow the request to proceed
//   return NextResponse.next();
// }

// // Configuration: By removing the 'matcher', this middleware will run on every request.
// // The logic inside the middleware function now handles which paths require authentication.
// export const config = {
//   runtime: "nodejs", // Keep Node.js runtime if 'headers()' is necessary for your auth setup
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
//     // Always run for API routes
//     "/(api|trpc)(.*)",
//   ],
// };
