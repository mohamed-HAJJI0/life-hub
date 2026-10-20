import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUserSettings } from "@/lib/settings";
import { getDictionary, resolveLocale, t } from "@/lib/i18n";

// Chinese Hub — an independent sub-app at the root URL `/chinese-hub`.
//
// Per `AGENTS.md` §5, a sub-app is NOT wrapped by the lobby shell: it brings
// its own chrome, and the way in is the Gallery card. This layout gives it a
// slim header and — just as important — a way back to the lobby, since the
// lobby's sidebar is not part of this tree.

export default async function ChineseHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getCurrentUserSettings();
  const dict = getDictionary(resolveLocale(settings.language));

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between gap-4 border-b border-border px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="size-4 shrink-0" />
          {t(dict, "chinese.back")}
        </Link>
        <p className="text-sm font-medium">{t(dict, "chinese.title")}</p>
      </header>
      <main className="flex-1 p-6 sm:p-10">{children}</main>
    </div>
  );
}
