// Global Clerk middleware. Runs on every request that matches the `config.matcher`.
//
// Protection model:
//   - Public (anyone, signed in or not): /, /login, /signup, /reset-password,
//     /verify-email, and any future `/sign-in/*` Clerk paths.
//   - Protected (sign-in required): every other route — currently /, /today,
//     /settings, plus future module hubs at the root like /chinese-hub.
//
// `auth.protect()` redirects unauthenticated users to the sign-in URL
// configured in `.env.local` (`NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login`).
//
// `createRouteMatcher` matches by URL path, not folder name, so route
// groups like `app/(lobby)/` don't add to the URL.
//
// Per `AGENTS.md` §5: auth lives in `proxy.ts` (Clerk's middleware) — no
// hand-rolled `lib/auth/`, no per-layout `auth.protect()`.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes — anyone can hit these, signed in or not.
const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/signup(.*)",
  "/reset-password(.*)",
  "/verify-email(.*)",
  "/sso-callback(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
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
