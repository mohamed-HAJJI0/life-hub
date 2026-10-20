import { DictionaryBrowser } from "./dictionary-browser";
import { getCurrentUserSettings } from "@/lib/settings";
import { getDictionary, resolveLocale, t } from "@/lib/i18n";
import { searchDictionary } from "@/lib/dictionary/queries";

// The Chinese dictionary.
//
// The page lives inside the Chinese Hub, so it inherits that app's own
// sidebar and top app bar (see `app/chinese-hub/layout.tsx`).
//
// The data comes from a SECOND database — the dictionary tables live in
// their own Neon instance, reached through `lib/dictionary/`.

export default async function DictionaryPage() {
  const settings = await getCurrentUserSettings();
  const locale = resolveLocale(settings.language);
  const dict = getDictionary(locale);

  // The first page is fetched here, on the server, so the list is already
  // there when the page arrives — no spinner on first paint, and no fetch
  // from an effect on the client.
  const firstPage = await searchDictionary({ query: "", offset: 0 });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t(dict, "chinese.dictionary.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(dict, "chinese.dictionary.subtitle")}
        </p>
      </header>

      <DictionaryBrowser
        locale={locale}
        initialItems={firstPage.items}
        initialHasMore={firstPage.hasMore}
      />
    </div>
  );
}
