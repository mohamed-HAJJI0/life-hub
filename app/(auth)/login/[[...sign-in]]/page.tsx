// /login — Clerk sign-in.
// Catch-all ([[...sign-in]]) is required so multi-step flows
// (e.g. /login/factor-two, email-link deep routes) resolve.
// Per `AGENTS.md` §5: auth pages live under `app/(auth)/`.
//
// <Suspense> wraps the Clerk component because it uses client hooks
// (usePathname) that block static prerendering. With Next.js cacheComponents,
// `export const dynamic = "force-dynamic"` is not allowed — <Suspense> is the
// streaming fix.

import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}
