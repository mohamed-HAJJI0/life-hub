import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserSettings } from "@/lib/settings";
import { getDictionary, resolveLocale, t } from "@/lib/i18n";

// The Chinese module's landing page.
//
// The module itself — add a character, review daily, track misses — is step 3
// (see `main todolist.md` §5). This page is the sub-app's shell: it exists so
// `/chinese-hub` is a real, navigable destination that the Gallery card can
// point at, and so the folder the module will grow into already has a home.
//
// Per `AGENTS.md` §5, the module's own UI will live in
// `app/chinese-hub/modules/chinese/` and its domain logic in the root
// `modules/chinese/` folder, with `app/chinese-hub/modules/_registry.ts` as
// this sub-app's registry. Those are step 2 / step 3 work, not this page.

export default async function ChineseHubPage() {
  const settings = await getCurrentUserSettings();
  const dict = getDictionary(resolveLocale(settings.language));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t(dict, "chinese.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(dict, "chinese.subtitle")}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t(dict, "chinese.empty.title")}
          </CardTitle>
          <CardDescription>
            {t(dict, "chinese.empty.description")}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
