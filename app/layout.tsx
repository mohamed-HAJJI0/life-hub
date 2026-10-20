import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { themeScript } from "@/lib/theme/theme-script";
import { getCurrentUserSettings } from "@/lib/settings";
import { resolveLocale } from "@/lib/i18n";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Life Hub",
  description: "Personal life dashboard",
};

/**
 * This layout BLOCKS instead of streaming.
 *
 * It reads the session + the user's settings so it can render the theme
 * and language onto <html>. Those are attributes on the root element, and
 * an attribute cannot be streamed in after the shell is flushed — the
 * browser has to have the right theme in the very first byte of HTML, or
 * the user sees a flash of the wrong theme.
 *
 * `instant = false` is Next's way of saying "this route waits for its data".
 * The alternative — streaming the theme in later — reintroduces exactly the
 * flash the no-FOUC script exists to prevent.
 */
export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The account-wide theme + language. The server renders these onto <html>
  // so the very first paint is already correct on a device that has no
  // local theme of its own — a database round-trip can't happen inside the
  // no-FOUC script, but the SSR HTML can carry it.
  //
  // The no-FOUC script still wins when this device HAS a local theme
  // (localStorage): the per-device choice is the more specific one, and the
  // script is the only thing that can read localStorage before paint.
  const settings = await getCurrentUserSettings();
  const locale = resolveLocale(settings.language);
  const mode = settings.themeMode === "dark" ? "dark" : "light";

  return (
    <html
      lang={locale}
      // SSR defaults. The no-FOUC <script> below overrides these from
      // localStorage before paint, then the React hook on the client keeps
      // state in sync. suppressHydrationWarning is required because the
      // attributes the script writes WILL differ from the SSR values.
      data-base={settings.themeBase}
      data-accent={settings.themeAccent}
      data-chart={settings.themeChart}
      data-mode-pref={settings.themeMode}
      data-mode={mode}
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <head>
        {/* No-FOUC: applies saved theme BEFORE first paint. See lib/theme/theme-script.ts. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ClerkProvider appearance={{ theme: shadcn }}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}