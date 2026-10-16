// /reset-password — uses Clerk's <SignIn /> with the password-reset flow active.
// In Clerk v6, password reset is part of the SignIn component's built-in
// "Forgot password?" link. Pointing users here directly is a convenience
// so we can link to it from the future settings page.
//
// Catch-all ([[...reset-password]]) handles deep links from the reset email
// (e.g. /reset-password/factor-one/abc123...).

import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <SignIn signInUrl="/reset-password" />
    </Suspense>
  );
}
