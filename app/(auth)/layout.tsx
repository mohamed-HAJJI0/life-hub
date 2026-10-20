// Minimal centered layout for the (auth) route group.
// Used by /login, /signup, /reset-password, /verify-email.
// Per `AGENTS.md` §5: auth pages live under `app/(auth)/`. The group is a
// route group (parens) so the URL has no `/auth` prefix.
//
// No auth.protect() here — this whole group is public by design.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      {children}
    </div>
  );
}
