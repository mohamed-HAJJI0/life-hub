import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserSettings } from "@/lib/settings";
import { getDictionary, resolveLocale, t } from "@/lib/i18n";

// The Sichuan University sub-app's landing page.
//
// Like the Chinese Hub landing page, this is the sub-app's shell: it exists so
// `/university` is a real, navigable destination that the Gallery card can
// point at, and so the folder any future Sichuan University modules will
// grow into already has a home.
//
// Per `AGENTS.md` §5, the module's own UI will live in
// `app/university/modules/<name>/` and its domain logic in the root
// `modules/<name>/` folder, with `app/university/modules/_registry.ts` as
// this sub-app's registry. Those are step 2 work, not this page.

export default async function UniversityPage() {
  const settings = await getCurrentUserSettings();
  const dict = getDictionary(resolveLocale(settings.language));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t(dict, "university.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t(dict, "university.subtitle")}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t(dict, "university.empty.title")}
          </CardTitle>
          <CardDescription>
            {t(dict, "university.empty.description")}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
