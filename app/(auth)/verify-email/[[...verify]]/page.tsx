// /verify-email — uses Clerk's <SignIn /> to handle the email-verification step.
// Sign-up users land here from the verification link in their inbox.
// Catch-all ([[...verify]]) handles the verification token in the URL.

import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <SignIn signInUrl="/verify-email" />
    </Suspense>
  );
}
