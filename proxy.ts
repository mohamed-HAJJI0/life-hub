// Global Clerk middleware. Runs on every request that matches the `config.matcher`.
//
// Protection model:
//   - Public (anyone, signed in or not): /login, /signup, /reset-password,
//     /verify-email, and Clerk's /sso-callback.
//   - Protected (sign-in required): every other route — currently /, /today,
//     plus future module hubs at the root like /chinese-hub.
//
// `auth.protect({ unauthenticatedUrl: '/login' })` redirects unauthenticated
// users to OUR /login page (not Clerk's default /sign-in, which 404s since
// we don't have that route). Built as an absolute URL because Next.js
// requires it in middleware.
//
// `createRouteMatcher` matches by URL path, not folder name, so route
// groups like `app/(lobby)/` don't add to the URL.
//
// Note: Clerk v7 deprecates `createRouteMatcher` in favor of resource-based
// auth checks. We stay on the current API for now; will migrate when Clerk
// ships the replacement.
//
// Per `AGENTS.md` §5: auth lives in `proxy.ts` (Clerk's middleware) — no
// hand-rolled `lib/auth/`, no per-layout `auth.protect()`.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes — anyone can hit these, signed in or not.
//
// Exported so the test suite can assert that every app route stays
// protected (see `tests/proxy.test.ts`).
export const PUBLIC_ROUTES = [
  "/login(.*)",
  "/signup(.*)",
  "/reset-password(.*)",
  "/verify-email(.*)",
  "/sso-callback(.*)",
];

const isPublicRoute = createRouteMatcher(PUBLIC_ROUTES);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    // Redirect unauthenticated users to our /login page (not Clerk's default
    // /sign-in, which would 404 since we don't have that route).
    // Next.js requires absolute URLs in middleware, so build one off req.url.
    const loginUrl = new URL("/login", req.url).toString();
    await auth.protect({ unauthenticatedUrl: loginUrl });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files (anything with an extension
    // except for known dynamic asset types).
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run on API routes.
    "/(api|trpc)(.*)",
  ],
};
