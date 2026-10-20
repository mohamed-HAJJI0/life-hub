// /signup — Clerk sign-up.
// Catch-all ([[...sign-up]]) is required so multi-step flows
// (e.g. /signup/verify-email-address) resolve.
// Per `AGENTS.md` §5: auth pages live under `app/(auth)/`.
//
// <Suspense> wraps the Clerk component because it uses client hooks
// (usePathname) that block static prerendering.

import { SignUp } from "@clerk/nextjs";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    <Suspense>
      <SignUp />
    </Suspense>
  );
}
