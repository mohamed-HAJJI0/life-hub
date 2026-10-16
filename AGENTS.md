# Life Hub — Working Rules

> Mandatory for every session that works in this repo. Read and follow before making any change.

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

- **Commit on the current feature branch.** The user works in a "commit after each apply" cadence — every approved plan lands as its own commit (or a small number of focused commits) on the active feature branch before any unrelated work. Push when it makes sense (new branch, end of a step, etc.); local commit is the minimum.
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
- **When to check:** before starting any non-trivial work, list `/plans/` and read the most recent (and any directly relevant) plan first.
- **When to write:** when a plan is approved (this session or a previous one), save it as a dated file in `/plans/` and add it to the list below.

### Current plans

- `plans/2026-10-16_1608-project-organizing-todolist.md` — full checklist (sections 1–5: foundation, module architecture, shared systems, dev hygiene, build order)
- `plans/2026-10-16_1608-project-plan-and-structure.md` — implementation order, file/folder organization, smallest viable cut for step 1
- `plans/2026-10-16_1810-install-shadcn-ui-and-theme.md` — shadcn/ui install (baseColor: taupe, preset `b2BXFGesy`) + runtime theme system (`lib/theme/`, localStorage key `life-hub:theme`, no-FOUC inline script)
- `plans/2026-10-16_1838-clerk-auth-and-lobby-shell.md` — Clerk auth (`@clerk/nextjs`, accountless dev, `proxy.ts` gate), `app/(lobby)/` shell + `app/(auth)/` pages, shadcn theme for Clerk components

### Hard rule

**Before planning any feature or refactor in this repo, read the current plans in `/plans/`.** If a new plan supersedes or extends an old one, write the new one with a fresh date-time prefix and update this list — do not silently edit or delete the old plan.

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
│   │   └── verify-email/[[...verify]]/page.tsx  # /verify-email
│   ├── (lobby)/                  # route group (no /lobby URL segment) — main app, protected
│   │   ├── layout.tsx            # sidebar + topbar (the "shell")
│   │   ├── page.tsx              # / (home dashboard)
│   │   ├── today/page.tsx        # /today — aggregate "what's due today"
│   │   └── settings/page.tsx     # /settings
│   ├── chinese-hub/              # (future) real folder, URL = /chinese-hub — separate sub-app
│   ├── api/                      # route handlers (if not using server actions)
│   ├── globals.css
│   └── layout.tsx                # root: fonts + no-FOUC + <ClerkProvider>
│
├── proxy.ts                      # Clerk middleware (auth gate) — runs on every request
│
├── components/                   # shared UI, NO module-specific logic
│   ├── ui/                       # shadcn primitives (Button, Card, Input…) — `npx shadcn@latest add <name>` to grow
│   ├── shell/                    # Sidebar, Topbar, NavLink
│   ├── widgets/                  # dashboard widget shells
│   └── theme-toggle.tsx          # cycle button (domain component, not a primitive)
│
├── lib/                          # infra shared across modules
│   ├── db/                       # db client + per-module schema files
│   │   ├── client.ts
│   │   └── schema/
│   │       ├── shared.ts         # users, settings, tags
│   │       ├── chinese.ts        # characters, reviews, sentences
│   │       └── index.ts
│   ├── scheduler/                # generic spaced-repetition engine
│   │   ├── due.ts                # dueItems(module, user, date)
│   │   └── review.ts             # recordReview(itemId, grade)
│   ├── activity/                 # activity log + streaks
│   ├── notifications/            # reminders stub
│   ├── settings/                 # user settings read/write (DB-backed; Clerk owns the session)
│   ├── theme/                    # runtime theme system (data, no-FOUC script, hook)
│   │   ├── themes.ts             # source of truth for theme tokens (4 themes)
│   │   ├── theme-script.ts       # inline <script> string for <head>
│   │   └── use-theme.ts          # client hook { theme, setTheme, cycle, themes }
│   ├── utils.ts                  # shadcn `cn()` re-export (from the `cn` package)
│   ├── export/                   # JSON export/import
│   ├── time/                     # timezone-aware date utils
│   └── types/                    # cross-cutting TS types
│
├── modules/                      # per-module domain logic (UI lives in app/)
│   └── chinese/
│       ├── service.ts            # addCharacter, getDue, logMiss
│       └── queries.ts
│
├── db/migrations/                # SQL migrations, tracked in git
│
├── public/                       # static + PWA assets (manifest.json, sw.js)
│
├── plans/                        # gitignored local working plans
├── components.json               # shadcn config — `style`, `baseColor`, `aliases`, `iconLibrary`. Source of truth; committed.
├── AGENTS.md
└── package.json
```

### Where does X go? (rules)

| If you're adding… | It goes in… |
|---|---|
| A new page or route | `app/(lobby)/<name>/page.tsx` (for shell-wrapped pages) or `app/(auth)/<name>/page.tsx` (for public auth pages) |
| A new life area / module (sub-app) | `app/<name>-hub/page.tsx` (real folder at root URL, e.g. `app/chinese-hub/` → `/chinese-hub`) + `modules/<name>/` for logic. Not wrapped by the lobby shell — each sub-app is independent. |
| A reusable UI primitive | `components/ui/` (only if it's a shadcn primitive; otherwise `components/<domain>/`) |
| A new shadcn primitive | `npx shadcn@latest add <name>` — never hand-roll. Don't bypass `components.json`. |
| Shell chrome (sidebar, nav) | `app/(lobby)/layout.tsx` — the shell itself lives here, not in `components/`. `components/shell/` is reserved for sub-components like Sidebar/Topbar if/when we extract them. |
| A theme-aware control (toggle, picker) | `components/<name>.tsx` (root of `components/`) — domain component, not a primitive |
| A theme color / value / palette | `lib/theme/themes.ts` — single source of truth; CSS in `app/globals.css` mirrors it |
| The no-FOUC inline script | `lib/theme/theme-script.ts` — invoked from `app/layout.tsx` `<head>` |
| The `cn()` classname helper | Already wired via `lib/utils.ts` (re-export of the `cn` package). Just import from `@/lib/utils`. |
| The auth gate / protected routes | `proxy.ts` (root) — Clerk's `clerkMiddleware()`. Public/protected route matchers live here. No per-layout `auth.protect()`. |
| Auth pages | `app/(auth)/<name>/[[...catchall]]/page.tsx` — wrap Clerk component in `<Suspense>` (Next.js cacheComponents-friendly) |
| Database tables shared by all modules | `lib/db/schema/shared.ts` (e.g. `users`, `settings`, `tags`) |
| Database tables for one module | `lib/db/schema/<module>.ts` (e.g. `chinese_characters`, `chinese_reviews`) — **table names are prefixed by module** |
| A SQL migration | `db/migrations/NNNN_<name>.sql` |
| Domain logic for a module (add/get/log) | `modules/<module>/service.ts` |
| Anything that knows "what's due today" | `lib/scheduler/` — modules plug in via a `dueSource` function |
| Activity / streak logic | `lib/activity/` |
| Auth session / user identity | **Clerk** (`@clerk/nextjs`). Do not hand-roll `lib/auth/`. The `userId` is available server-side via `await auth()` from `@clerk/nextjs/server`. |
| User settings read/write | `lib/settings/` (DB-backed; session is Clerk's) |
| Theme tokens / runtime theme system | `lib/theme/` — see `plans/2026-10-16_1810-install-shadcn-ui-and-theme.md` for the data shape |
| Clerk env vars (`CLERK_*`, `NEXT_PUBLIC_CLERK_*`) | `.env.local` (gitignored via `.env*`) |
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

Every life area registers itself in `app/(app)/modules/_registry.ts`. Adding a new module = one entry. Shape:

```ts
export const chinese = {
  id: "chinese",                   // unique, lowercase, used in routes + table prefix
  name: "Chinese",
  icon: "Languages",               // lucide icon name
  route: "/modules/chinese",
  dashboardWidget: ChineseWidget,  // component shown on home dashboard
  dueSource: chineseDueSource,     // plugs into generic scheduler (lib/scheduler)
} satisfies ModuleDef;
```

The registry powers: sidebar nav, dashboard widgets, the `/today` page, and the scheduler. Do not bypass it with hardcoded module lists.

### Naming conventions

- **Folders:** lowercase, kebab-case (`chinese/`, `lib/scheduler/`)
- **Files:** lowercase, kebab-case for routes/queries; PascalCase for React components
- **DB tables:** `<module>_<entity>` — `chinese_characters`, `chinese_reviews`, `tasks_items`
- **TS types:** PascalCase, no `I` prefix (`ModuleDef`, not `IModuleDef`)
- **Migrations:** `NNNN_<name>.sql` starting at `0001_`, sequential, never edited after merge
- **Plans:** `plans/YYYY-MM-DD_HHMM-<name>.md`
