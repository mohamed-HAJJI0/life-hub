import { createRouteMatcher } from "@clerk/nextjs/server";
import { describe, expect, it } from "vitest";
import { PUBLIC_ROUTES } from "../proxy";

// The auth gate. `proxy.ts` protects every route that is not explicitly
// public, so a route that accidentally lands in the public list is
// reachable without a session — this test is the tripwire for that.
//
// `createRouteMatcher` only reads `req.nextUrl.pathname`, so a plain object
// is enough to exercise it.

const isPublic = createRouteMatcher(PUBLIC_ROUTES);

function isPublicPath(pathname: string): boolean {
  return isPublic({ nextUrl: { pathname } } as never);
}

describe("the public routes", () => {
  it("are the auth pages", () => {
    expect(PUBLIC_ROUTES).toEqual([
      "/login(.*)",
      "/signup(.*)",
      "/reset-password(.*)",
      "/verify-email(.*)",
      "/sso-callback(.*)",
    ]);
  });

  it("let the sign-in and sign-up pages through", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/signup")).toBe(true);
    expect(isPublicPath("/reset-password")).toBe(true);
    expect(isPublicPath("/verify-email")).toBe(true);
    expect(isPublicPath("/sso-callback")).toBe(true);
  });

  it("let a Clerk catch-all path through", () => {
    expect(isPublicPath("/login/abc123")).toBe(true);
    expect(isPublicPath("/verify-email/abc123")).toBe(true);
  });
});

describe("the app routes", () => {
  it("are all protected", () => {
    const protectedPaths = [
      "/",
      "/today",
      "/gallery",
      "/university",
      "/chinese-hub",
      "/chinese-hub/dictionary",
      "/api/dictionary",
    ];

    for (const path of protectedPaths) {
      expect(isPublicPath(path), `${path} must require a session`).toBe(false);
    }
  });
});
