# Life Hub — Working Rules

> Mandatory for every session that works in this repo. Read and follow before making any change.

> ### ⛔ NEVER PUSH
>
> Do not run `git push` — not at the end of a step, not for a new branch, not
> "just to keep the remote in sync". **Local commits only.** The user owns
> pushing. If a change seems to need a push, say so in your summary and let
> the user decide.

## 1. Plan first — always (core rule)

Never change a file without an approved plan. For ANY change — code, features, refactors, configs, dependencies, renames, deletions, git actions — follow this loop:

1. **PLAN** — write a short, concrete plan before touching anything:
   - Files affected + exactly what changes in each
   - Why / what goal it serves
   - Destructive parts (deletes, overwrites) called out explicitly
   - If multiple good options exist: list up to 3, recommend one
2. **SHOW** — present the plan to the user in chat.
3. **WAIT** — make no edits until the user answers. Zero exceptions, even for "one-line" or "obvious" fixes.
4. **APPLY or MODIFY**
   - On approval ("apply", "go", "yes") → apply exactly the plan, nothing more.
   - On feedback → revise the plan, show it again, and wait again.

Reading, searching, and exploring the codebase are always allowed — only *changes* need approval.
Reversible safety net: git has an `init` commit; never commit or discard anything without an approved plan that says so.

## 2. After an approved plan is applied

- **Commit on the current feature branch.** The user works in a "commit after each apply" cadence — every approved plan lands as its own commit (or a small number of focused commits) on the active feature branch before any unrelated work.
- **Never push.** See the ⛔ NEVER PUSH callout at the top of this file. A local commit is the end of the job; the user pushes. If the plan itself says to push, the plan is wrong — flag it instead of following it.
- Verify the result: run build / lint / tests when the change warrants it.
- Summarize what actually changed vs. what was planned (including anything skipped).

## 3. Presentation style

- One plan per message — short, scannable, bulleted.
- No surprise edits: nothing outside the approved plan.
- Flag risk and destructive actions in bold.

## 4. Project plans (check before working)

The Life Hub project has its own planning lives in a dedicated, **gitignored** folder. Plans live there, not in chat, so they don't get lost between sessions.

- **Folder:** `/plans/` (entire folder is in `.gitignore`)
- **Filename convention:** every plan starts with the date and time it was added: `YYYY-MM-DD_HHMM-<plan-name>.md`
- **The checklist itself is tracked at the repo root:** `main todolist.md` — sections 1–5 (foundation, module architecture, shared systems, dev hygiene, build order). It is the single source of truth for what still needs doing; this list points at the working plans.
- **When to check:** before starting any non-trivial work, list `/plans/` and read the most recent (and any directly relevant) plan first.
- **When to write:** when a plan is approved (this session or a previous one), save it as a dated file in `/plans/` and add it to the list below.

### Current plans

- `main todolist.md` (repo root) — **the full checklist** (sections 1–5: foundation, module architecture, shared systems, dev hygiene, build order) and the single source of truth for what still needs doing
- `plans/2026-10-16_1608-project-plan-and-structure.md` — implementation order, file/folder organization, smallest viable cut for step 1
- `plans/2026-10-16_1810-install-shadcn-ui-and-theme.md` — shadcn/ui install (baseColor: taupe, preset `b2BXFGesy`) + runtime theme system (`lib/theme/`, localStorage key `life-hub:theme`, no-FOUC inline script)
- `plans/2026-10-16_1838-clerk-auth-and-lobby-shell.md` — Clerk auth (`@clerk/nextjs`, accountless dev, `proxy.ts` gate), `app/(lobby)/` shell + `app/(auth)/` pages, shadcn theme for Clerk components
- `plans/2026-10-16_1915-collapsible-sidebar-and-unified-settings.md` — collapsible sidebar (`components/shell/sidebar.tsx`, localStorage `life-hub:sidebar-collapsed`) + unified `/settings` (Clerk `<UserProfile />` reached from sidebar and from `UserButton`'s "Manage account" via `userProfileUrl="/settings"`) — **superseded by `2026-10-16_1935-floating-userprofile-modal.md`** (no page, modal only)
- `plans/2026-10-16_1935-floating-userprofile-modal.md` — Settings button calls `useClerk().openUserProfile()` to open Clerk's `<UserProfile />` as a floating modal; no `/settings` page
- `plans/2026-10-16_2155-shadcn-theme-editor.md` — shadcn-style theme editor: 7 bases × 24 accents × 24 charts × light/dark/system, sourced from the live registry (`lib/theme/shadcn-data.json` + auto-generated `app/theme-tokens.css`), verified by `scripts/verify-theme-tokens.mjs` (174 PASS / 0 FAIL)
- `plans/2026-10-20_1640-db-layer-and-settings.md` — **step 1 close-out**: Neon Postgres + Drizzle data layer (`lib/db/`, `db/migrations/0000_baseline.sql` + `0001_add_auth_id.sql` + `0002_add_settings.sql`), DB-backed language + timezone settings, i18n shell, server-component shell
- `plans/2026-10-20_1645-module-registry-and-per-app-modules.md` — **PROPOSED (step 2, not yet approved)**: per-app `modules/` folders + per-app `_registry.ts`
- `plans/2026-10-20_1805-drop-tags-and-db-theme.md` — **APPLIED**: drop the unused `tags` table + move the theme into `settings` (4 columns) with `localStorage` kept as the per-device override; also fixed a long-standing no-FOUC script syntax error (locked in by `scripts/test-theme-script.mjs`)

### Hard rule

**Before planning any feature or refactor in this repo, read `main todolist.md` and the current plans in `/plans/`.** If a new plan supersedes or extends an old one, write the new one with a fresh date-time prefix and update this list — do not silently edit or delete the old plan.

## 5. File organization (where things go)

This is the canonical layout. The full rationale lives in `plans/2026-10-16_1608-project-plan-and-structure.md`; this section is the rule of the road.

### Folder tree

```
life-hub/
├── app/                          # Next.js App Router — routes only, stay thin
│   ├── (auth)/                   # route group (no /auth URL segment) — public auth pages
│   │   ├── layout.tsx            # minimal centered layout
│   │   ├── login/[[...sign-in]]/page.tsx        # /login — Clerk <SignIn />
│   │   ├── signup/[[...sign-up]]/page.tsx       # /signup — Clerk <SignUp />
│   │   ├── reset-password/[[...reset-password]]/page.tsx  # /reset-password
│   │   ├── verify-email/[[...verify]]/page.tsx  # /verify-email
│   │   └── modules/              # THIS app's modules (+ _registry.ts) — per-app, never shared
│   ├── (lobby)/                  # route group (no /lobby URL segment) — main app, protected
│   │   ├── layout.tsx            # sidebar + topbar (the "shell") — server component
│   │   ├── page.tsx              # / (home dashboard)
│   │   ├── today/page.tsx        # /today — aggregate "what's due today"
│   │   └── modules/              # THIS app's modules (+ _registry.ts) — per-app, never shared
│   │       ├── _registry.ts      # the lobby's module registry
│   │       └── <module>/         # this module's pages + components
│   ├── chinese-hub/              # (future) real folder, URL = /chinese-hub — separate sub-app
│   │   └── modules/              # THIS app's modules (+ _registry.ts) — per-app, never shared
│   ├── api/                      # route handlers (if not using server actions)
│   ├── globals.css
│   └── layout.tsx                # root: fonts + no-FOUC + <ClerkProvider>
│
├── proxy.ts                      # Clerk middleware (auth gate) — runs on every request
│
├── components/                   # shared UI, NO module-specific logic
│   ├── ui/                       # shadcn primitives (Button, Card, Input…) — `npx shadcn@latest add <name>` to grow
│   ├── shell/                    # shell chrome used by the lobby layout
│   │   ├── sidebar.tsx           # collapsible sidebar (icon-only / full) — client component
│   │   ├── user-menu.tsx         # avatar + account menu (replaces Clerk <UserButton />)
│   │   ├── settings-modal.tsx    # our <Dialog> wrapping Clerk's <UserProfile> + custom tabs
│   │   ├── settings-store.tsx    # "use client" context: the modal's open state
│   │   ├── shell-providers.tsx   # client boundary that carries that context
│   │   └── settings-tabs/        # one file per custom tab (theme, language, timezone)
│   ├── widgets/                  # dashboard widget shells
│
├── lib/                          # infra shared across modules
│   ├── db/                       # db client + per-module schema files
│   │   ├── client.ts             # Neon HTTP driver + Drizzle instance — SERVER-ONLY
│   │   ├── tables.ts             # EVERY table name the app owns, in one place
│   │   └── schema/
│   │       ├── shared.ts         # users (shared with another app), settings
│   │       ├── chinese.ts        # (planned) characters, reviews, sentences
│   │       └── index.ts          # re-exports — the single schema entry point
│   ├── scheduler/                # (planned, step 4) generic spaced-repetition engine
│   │   ├── due.ts                # dueItems(module, user, date)
│   │   └── review.ts             # recordReview(itemId, grade)
│   ├── activity/                 # (planned) activity log + streaks
│   ├── notifications/            # (planned) reminders stub
│   ├── settings/                 # user settings read/write (DB-backed; Clerk owns the session)
│   │   ├── index.ts              # getUserSettings (cached per user) + upsertUserSettings
│   │   └── actions.ts            # "use server" mutations — authenticate + validate
│   ├── theme/                    # shadcn-style runtime theme system (v3)
│   │   ├── constants.ts          # STORAGE_KEY + defaults (no React, safe to import from the no-FOUC script)
│   │   ├── use-theme.ts          # client hook { config, mode, modePref, setBase, setAccent, setChart, setModePref, resetTheme }
│   │   ├── theme-script.ts       # inline <script> for <head> (no-FOUC + OS color-scheme listener)
│   │   ├── migration.ts          # v1/v2 ({id, mode?}) → v3 ({base, accent, chart, modePref})
│   │   ├── valid-values.ts       # the 7 bases / 24 accents / 3 modes, derived from the registry data — used for server-side validation
│   │   ├── shadcn-data.json      # AUTO-GENERATED: 7 bases × 24 accents × 2 modes, from the live registry
│   │   └── themes.ts             # (deleted; replaced by the JSON + scripts)
│   ├── utils.ts                  # shadcn `cn()` re-export (from the `cn` package)
│   ├── export/                   # (planned) JSON export/import
│   ├── time/                     # timezone-aware date utils — day boundaries live here
│   ├── i18n/                     # translations (messages/<locale>.json) + `t()` helper
│   └── types/                    # (planned) cross-cutting TS types (ModuleDef, …)
│
├── modules/                      # per-module domain logic (UI lives in the owning app)
│   └── chinese/                  # (planned, step 3)
│       ├── service.ts            # addCharacter, getDue, logMiss
│       └── queries.ts
│
├── db/migrations/                # SQL migrations, tracked in git — 0000_init.sql is applied
│
├── public/                       # static + PWA assets (manifest.json, sw.js)
│
├── plans/                        # gitignored local working plans
├── components.json               # shadcn config — `style`, `baseColor`, `aliases`, `iconLibrary`. Source of truth; committed.
├── drizzle.config.ts             # Drizzle Kit config — schema → lib/db/schema, out → db/migrations
├── .env.example                  # tracked template for every required env var (no secrets)
├── AGENTS.md
└── package.json
```

### Where does X go? (rules)

| If you're adding… | It goes in… |
|---|---|
| A new page or route | `app/(lobby)/<name>/page.tsx` (for shell-wrapped pages) or `app/(auth)/<name>/page.tsx` (for public auth pages) |
| A new life area / module (sub-app) | `app/<name>-hub/page.tsx` (real folder at root URL, e.g. `app/chinese-hub/` → `/chinese-hub`) + `modules/<name>/` for logic. Not wrapped by the lobby shell — each sub-app is independent. |
| A module **of an app X** | `app/X/modules/<name>/page.tsx` (UI) + root `modules/<name>/service.ts` (domain logic). Every app owns its own `modules/` folder — modules are never shared between apps. See `plans/2026-10-20_1645-module-registry-and-per-app-modules.md`. |
| The module registry **of an app X** | `app/X/modules/_registry.ts` — one per app (`(lobby)`, `(auth)`, each future sub-app). Not a single global registry. |
| A reusable UI primitive | `components/ui/` (only if it's a shadcn primitive; otherwise `components/<domain>/`) |
| A new shadcn primitive | `npx shadcn@latest add <name>` — never hand-roll. Don't bypass `components.json`. |
| Shell chrome (sidebar, nav) | `app/(lobby)/layout.tsx` — the shell itself lives here, not in `components/`. Sub-components (Sidebar, future Topbar/Rightbar) live in `components/shell/`. Keep the shell a server component; extract only the parts that need client state (Sidebar is the canonical example — it owns the `collapsed` localStorage state). |
| A theme-aware control (toggle, picker) | `components/<name>.tsx` (root of `components/`) — domain component, not a primitive |
| A theme color / value / palette | `lib/theme/shadcn-data.json` — single source of truth, **built from the live shadcn registry** by `scripts/fetch-shadcn-data.mjs`. CSS lives in `app/theme-tokens.css` (also auto-generated, 110 selectors). The no-FOUC `<head>` script and the React hook both read this layout. Don't hand-edit colors — see `plans/2026-10-16_2155-shadcn-theme-editor.md`. |
| The no-FOUC inline script | `lib/theme/theme-script.ts` — invoked from `app/layout.tsx` `<head>` |
| The `cn()` classname helper | Already wired via `lib/utils.ts` (re-export of the `cn` package). Just import from `@/lib/utils`. |
| The auth gate / protected routes | `proxy.ts` (root) — Clerk's `clerkMiddleware()`. Public/protected route matchers live here. No per-layout `auth.protect()`. |
| Auth pages | `app/(auth)/<name>/[[...catchall]]/page.tsx` — wrap Clerk component in `<Suspense>` (Next.js cacheComponents-friendly) |
| The user-profile / settings modal | **Our shadcn `<Dialog>`** wraps Clerk's `<UserProfile routing="hash">` (`components/shell/settings-modal.tsx`). Sidebar Settings button toggles local `settingsOpen` state. Custom tabs (e.g. Theme) declared as `<UserProfile.Page>` children with their own content files under `components/shell/settings-tabs/`. `<UserButton />` "Manage account" still works (Clerk renders its own user-profile modal by default — to use the same one, mount `<SettingsModal />` next to the `<UserButton />` and route through it). |
| Keeping Clerk's tab state alive | `components/shell/use-hash-guard.ts` — **required** while the settings modal is open. Next.js's `HistoryUpdater` calls `history.replaceState(canonicalUrl)` after every render, and the canonical URL never contains the fragment (browsers don't send it to the server), which strips Clerk's hash-router state and bounces the modal back to its first tab. The guard preserves the fragment for same-path updates only. |
| Database tables shared by all modules | `lib/db/schema/shared.ts` (e.g. `users`, `settings`) |
| A table name | `lib/db/tables.ts` — the single place. Change it there and the schema, the queries and the next migration all follow. Never hard-code a table name in a query. |
| Database tables for one module | `lib/db/schema/<module>.ts` (e.g. `chinese_characters`, `chinese_reviews`) — **table names are prefixed by module** |
| A SQL migration | `db/migrations/NNNN_<name>.sql` — generated by `npx drizzle-kit generate --name <name>` (do not hand-write) |
| The database client | `lib/db/client.ts` — **server-only**, never import it from a client component |
| A server action | `lib/<domain>/actions.ts` with a `"use server"` directive — domain logic stays in `lib/`, pages stay thin |
| A translated string | `lib/i18n/messages/<locale>.json` — read via `t()` from `lib/i18n`. Add a language by adding one JSON file with the same keys. |
| Domain logic for a module (add/get/log) | `modules/<module>/service.ts` |
| Anything that knows "what's due today" | `lib/scheduler/` — modules plug in via a `dueSource` function |
| Day boundaries, "today", timezone math | `lib/time/` — `getTodayInTz`, `startOfDayInTz`, `formatDateInTz`. Never compare raw `Date` objects to decide what "today" means; the day boundary is the user's timezone. **Never call `new Date()` in a Server Component** — Next refuses to bake an unstable value into the prerendered shell. Read "now" through a client component that calls `use(io())` (see `app/(lobby)/today/local-date.tsx`). |
| Activity / streak logic | `lib/activity/` |
| Auth session / user identity | **Clerk** (`@clerk/nextjs`). Do not hand-roll `lib/auth/`. The `userId` is available server-side via `await auth()` from `@clerk/nextjs/server`. |
| User settings read/write | `lib/settings/` (DB-backed; session is Clerk's) — `index.ts` for reads/writes, `actions.ts` for `"use server"` mutations. Language + timezone + the theme are DB-backed; the theme ALSO lives in localStorage as the per-device override (see §5 Database). `settings.user_id` is the Clerk id, referencing `users.auth_id`. |
| Theme tokens / runtime theme system | `lib/theme/` + `app/theme-tokens.css` + `scripts/fetch-shadcn-data.mjs` + `scripts/generate-theme-css.mjs` + `scripts/verify-theme-tokens.mjs` + `scripts/test-theme-script.mjs` — see `plans/2026-10-16_2155-shadcn-theme-editor.md` for the data shape and verification protocol. The Theme tab in `components/shell/settings-tabs/theme-tab-content.tsx` is the only entry point. |
| Clerk env vars (`CLERK_*`, `NEXT_PUBLIC_CLERK_*`) | `.env.local` (gitignored via `.env*`) — the tracked template is `.env.example`; keep the two in sync when you add a variable |
| A new project plan | `plans/YYYY-MM-DD_HHMM-<name>.md` + update §4 list |

### shadcn/ui

We use [shadcn/ui](https://ui.shadcn.com/) for UI primitives. The model:
- `npx shadcn@latest init` writes `components.json` (config — committed) and `lib/utils.ts` (`cn` helper).
- `npx shadcn@latest add <name>` drops a copy of the component into `components/ui/`. We OWN the code; we edit it freely.
- The CLI uses `@base-ui/react` (Base UI) for primitives, not Radix UI. Don't replace it.
- **Never bypass `components.json`** — if a primitive needs new config (e.g. a different icon library), update it there.
- Current config: `style: base-nova`, `baseColor: taupe` (preset `b2BXFGesy`), `iconLibrary: lucide`.

### Clerk (auth)

We use [Clerk](https://clerk.com) for authentication — no hand-rolled `lib/auth/`. The model:
- `<ClerkProvider>` wraps `{children}` in `app/layout.tsx` (inside `<body>`, per Clerk's critical rule).
- `proxy.ts` at the project root is the global middleware (`clerkMiddleware()`) — it gates protected routes via `createRouteMatcher` and `auth.protect()`. Don't put `auth.protect()` in layouts; the middleware handles it.
- Auth pages live under `app/(auth)/` as route groups so URLs are clean (`/login`, `/signup`, `/reset-password`, `/verify-email` — no `/auth/` prefix). All catch-all pages wrap the Clerk component in `<Suspense>` (Next.js cacheComponents requirement; the `dynamic = "force-dynamic"` export is not compatible with cacheComponents).
- Clerk UI matches shadcn via `<ClerkProvider appearance={{ theme: shadcn }}>` and `@import "@clerk/ui/themes/shadcn.css";` in `app/globals.css`.
- Dev keys are written to `.env.local` by `npx -y clerk@latest init --no-skills` (accountless mode — no account or CLI login required). When ready for production, the user runs `npx -y clerk@latest auth login` to claim the app, then `npx -y clerk@latest env pull --instance prod` to fetch prod keys.
- The current dev app is accountless; URLs in `.env.local`: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup`, both fall back to `/` on success.

### Module registry (the central pattern)

**Modules are per-app.** Every app — route group *or* root sub-app — owns its
own `modules/` folder and its own registry inside it. There is no global
registry.

```
app/(lobby)/modules/_registry.ts       # the lobby's modules
app/(auth)/modules/_registry.ts        # the auth app's modules
app/<name>-hub/modules/_registry.ts    # each future sub-app's modules
```

An app's registry powers **that app's** sidebar nav, dashboard widgets,
`/today` page, and scheduler. A module registered in one app never appears in
another app's nav. Do not bypass a registry with hardcoded module lists.

Adding a module to an app = one entry. Shape:

```ts
export const chinese = {
  id: "chinese",                   // unique within the app, lowercase, used in routes + table prefix
  name: "Chinese",
  icon: "Languages",               // lucide icon name
  route: "/modules/chinese",
  dashboardWidget: ChineseWidget,  // component shown on the app's home dashboard
  dueSource: chineseDueSource,     // plugs into generic scheduler (lib/scheduler)
} satisfies ModuleDef;
```

`ModuleDef` is a cross-cutting type → `lib/types/`. The registry itself is
implemented in step 2 — see `plans/2026-10-20_1645-module-registry-and-per-app-modules.md`.

### Database (Neon Postgres + Drizzle)

- **Neon Postgres** is the database. Connection string lives in `.env.local` as
  `DATABASE_URL` (gitignored via `.env*`). Use the **pooled** endpoint.
- **The database is shared with another app.** `public` also holds `courses`,
  `posts`, `post-content`, `submissions` and `accepted-ids`, which belong to
  that app. **We do not model them.** Leaving them out of the schema is
  exactly what stops `drizzle-kit` from ever proposing to drop them — do not
  "helpfully" add them.
- **`users` is that app's table, extended by us.** It was not created by
  Drizzle: its primary key is a surrogate `uuid`, not our auth id. Life Hub
  identifies a user by the **`auth_id`** column we added (the Clerk user id,
  unique, NULL for rows that never signed in to Life Hub). The Drizzle model
  mirrors the real table **exactly** — every column, including the other
  app's `name` / `student_id` / `password_hashed` / `hashing-salt` / `roles`.
  If the model drifts, a generated migration would emit SQL that destroys
  the other app's data.
  - The table also has a UNIQUE index on `lower(email)`. A functional index
    can't be expressed in Drizzle, so it isn't modelled — and it is safe,
    because migrations only run the SQL they contain.
- **Every table name lives in `lib/db/tables.ts`.** The schema references it
  (`pgTable(TABLES.users, …)`) so a rename is one edit.
- `drizzle.config.ts` points `schema` at `lib/db/schema/index.ts` and `out` at
  `db/migrations`. It loads `.env.local` via `dotenv` — **drizzle-kit does not
  read `.env.local` on its own** (Next.js does).
- **Migrations are generated, never hand-written:**
  `npx drizzle-kit generate --name <name>` writes
  `db/migrations/NNNN_<name>.sql` + the `meta/` journal. Apply with
  `npx drizzle-kit migrate`.
- **The Neon HTTP driver has no transactions.** A migration that fails
  half-way leaves its earlier statements applied. After a failure, inspect
  the database and re-run — do not assume it rolled back.
- `db/migrations/0000_baseline.sql` describes the shared `users` table as it
  already existed and is **marked as applied** in the target database's
  `drizzle.__drizzle_migrations` table. Never re-run it.
- The **Clerk user id is `users.auth_id`** — it is the spine of everything.
  `settings.user_id` references it, so a user's settings are found with the
  id the app already has, without an extra lookup.
- **The theme is stored in BOTH places, with a fixed precedence:**
  - `localStorage["life-hub:theme"]` — the **per-device** choice. The no-FOUC
    script can only read this before first paint, so it wins on the device
    where the user made the change.
  - `settings.theme_*` (base / accent / chart / mode) — the **account-wide**
    default, rendered onto `<html>` by the server so a new device starts on
    the right theme with no flash.
  - Only an **explicit** user action writes to the database. Mounting the
    Theme tab must not persist, or a stale device would overwrite the
    account-wide theme on every visit.
- The root layout is a **blocking** route (`export const instant = false`):
  it reads the session + settings so `<html>` carries the right theme and
  `lang` in the very first byte. An attribute cannot be streamed in after
  the shell is flushed.

### Naming conventions

- **Folders:** lowercase, kebab-case (`chinese/`, `lib/scheduler/`)
- **Files:** lowercase, kebab-case for routes/queries; PascalCase for React components
- **DB tables:** `<module>_<entity>` — `chinese_characters`, `chinese_reviews`, `tasks_items`
- **TS types:** PascalCase, no `I` prefix (`ModuleDef`, not `IModuleDef`)
- **Migrations:** `NNNN_<name>.sql` — drizzle-kit numbers from `0000_`; sequential, never edited after merge. Each file has a sibling snapshot in `db/migrations/meta/` — commit both.
- **Plans:** `plans/YYYY-MM-DD_HHMM-<name>.md`

## 6. Where the project stands

Build order lives in `plans/2026-10-16_1608-project-plan-and-structure.md`.

| # | Step | Status |
|---|---|---|
| 1 | Auth + shell + settings | ✅ **done** — Clerk auth, collapsible sidebar, theme editor (localStorage), language + timezone (Neon/Drizzle), server-component shell, i18n `en`/`zh` |
| 2 | Module registry + empty dashboard | ⬜ next — per-app `modules/` + `_registry.ts`; the sidebar's nav list is still hardcoded |
| 3 | Chinese module v1 | ⬜ — add a character, review daily, track misses |
| 4 | Extract generic scheduler | ⬜ — `lib/scheduler/` |
| 5 | Today view (aggregate) | ⬜ — `/today` is a placeholder; it already shows the user's local date |
| 6 | Second module (tasks or habits) | ⬜ — proves the base is reusable |

**Still owed before step 6:** PWA setup (`public/` is empty — no `manifest.json`,
no `sw.js`) and JSON export/import (`lib/export/` does not exist).

### Environment

`.env.local` holds the real values (gitignored); `.env.example` is the tracked
template and must list every required key. Required today:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client key |
| `CLERK_SECRET_KEY` | Clerk server key — never commit |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `..._SIGN_UP_URL` | `/login` / `/signup` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` / `..._SIGN_UP_FALLBACK_REDIRECT_URL` | `/` |
| `DATABASE_URL` | Neon **pooled** connection string |

### Verification commands

Run these before declaring a change done — they are the project's regression net:

```bash
npm run lint                              # must exit 0
npm run build                             # must pass (also type-checks)
node scripts/verify-theme-tokens.mjs      # must report PASS: 174 / FAIL: 0
node scripts/test-theme-script.mjs         # must report ALL CHECKS PASSED (no-FOUC script)
node scripts/test-hash-guard.mjs          # must report ALL CHECKS PASSED (Clerk tab state)
npx drizzle-kit generate --name <name>    # after a schema change
npx drizzle-kit migrate                   # to apply it to Neon
```
