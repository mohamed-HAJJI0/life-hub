// Gallery — a plain lobby page (not a module yet).
//
// Per `AGENTS.md` §5: a shell-wrapped page lives at `app/(lobby)/<name>/page.tsx`
// (route group, no URL segment). Like the home and today pages, this is a
// server component, so it can read the user's language and render the right
// locale.
//
// The gallery is DATA-DRIVEN: adding a life area = adding one entry to
// `GALLERY_ENTRIES`. The first entry links to `/chinese-hub`, a sub-app at a
// root URL that is deliberately NOT wrapped by the lobby shell.
//
// The sidebar entry is still hardcoded — the module registry (step 2) replaces
// that list; see
// `plans/2026-10-20_1645-module-registry-and-per-app-modules.md`.

import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getCurrentUserSettings } from "@/lib/settings";
import { getDictionary, resolveLocale, t } from "@/lib/i18n";

type GalleryEntry = {
  /** Where the card goes. `null` = not a link yet (a "coming soon" tile). */
  href: string | null;
  image: { src: string; width: number; height: number };
  /** Dictionary keys — the page never hardcodes a label. */
  titleKey: string;
  descriptionKey: string;
  imageAltKey: string;
};

const GALLERY_ENTRIES: GalleryEntry[] = [
  {
    href: "/chinese-hub",
    image: { src: "/gallery/placeholder.png", width: 1200, height: 800 },
    titleKey: "gallery.chinese.title",
    descriptionKey: "gallery.chinese.description",
    imageAltKey: "gallery.chinese.imageAlt",
  },
  {
    href: null,
    image: { src: "/gallery/placeholder.png", width: 1200, height: 800 },
    titleKey: "gallery.comingSoon.title",
    descriptionKey: "gallery.comingSoon.description",
    imageAltKey: "gallery.comingSoon.imageAlt",
  },
];

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
        {GALLERY_ENTRIES.map((entry, index) => {
          const card = (
            <Card
              className={cn(
                "h-full overflow-hidden",
                entry.href && "transition-shadow group-hover:shadow-md",
              )}
            >
              {/* The image goes first so the Card's built-in
                  `>img:first-child` styling rounds its top corners. */}
              <Image
                src={entry.image.src}
                alt={t(dict, entry.imageAltKey)}
                width={entry.image.width}
                height={entry.image.height}
                sizes="(max-width: 768px) 100vw, 512px"
                className={cn(
                  "h-auto w-full object-cover",
                  !entry.href && "opacity-60 saturate-0",
                )}
                priority={index === 0}
              />
              <CardHeader>
                <CardTitle className="text-base">
                  {t(dict, entry.titleKey)}
                </CardTitle>
                <CardDescription>
                  {t(dict, entry.descriptionKey)}
                </CardDescription>
              </CardHeader>
            </Card>
          );

          if (!entry.href) {
            return <div key={entry.titleKey}>{card}</div>;
          }

          return (
            <Link
              key={entry.titleKey}
              href={entry.href}
              className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {card}
            </Link>
          );
        })}
      </section>
    </div>
  );
}
