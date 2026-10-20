// Gallery — a plain lobby page (not a module yet).
//
// Per `AGENTS.md` §5: a shell-wrapped page lives at `app/(lobby)/<name>/page.tsx`
// (route group, no URL segment). Like the home and today pages, this is a
// server component, so it can read the user's language and render the right
// locale.
//
// The sidebar entry is still hardcoded — the module registry (step 2) replaces
// that list; see
// `plans/2026-10-20_1645-module-registry-and-per-app-modules.md`.

import Image from "next/image";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserSettings } from "@/lib/settings";
import { getDictionary, resolveLocale, t } from "@/lib/i18n";

export default async function GalleryPage() {
  const settings = await getCurrentUserSettings();
  const dict = getDictionary(resolveLocale(settings.language));

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t(dict, "gallery.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(dict, "gallery.subtitle")}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          {/* The image goes first so the Card's built-in
              `>img:first-child` styling rounds its top corners. */}
          <Image
            src="/gallery/placeholder.png"
            alt={t(dict, "gallery.card.imageAlt")}
            width={1200}
            height={800}
            sizes="(max-width: 768px) 100vw, 512px"
            className="h-auto w-full object-cover"
            priority
          />
          <CardHeader>
            <CardTitle className="text-base">
              {t(dict, "gallery.card.title")}
            </CardTitle>
            <CardDescription>
              {t(dict, "gallery.card.description")}
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
