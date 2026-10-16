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

### Hard rule

**Before planning any feature or refactor in this repo, read the current plans in `/plans/`.** If a new plan supersedes or extends an old one, write the new one with a fresh date-time prefix and update this list — do not silently edit or delete the old plan.

## 5. File organization (where things go)

This is the canonical layout. The full rationale lives in `plans/2026-10-16_1608-project-plan-and-structure.md`; this section is the rule of the road.

### Folder tree

```
life-hub/
├── app/                          # Next.js App Router — routes only, stay thin
│   ├── (auth)/                   # unauthenticated: sign-in, sign-up
│   ├── (app)/                    # authenticated shell
│   │   ├── layout.tsx            # sidebar + topbar
│   │   ├── page.tsx              # home dashboard
│   │   ├── today/page.tsx        # aggregate "what's due today"
│   │   ├── settings/page.tsx
│   │   └── modules/              # one folder per life area
│   │       ├── _registry.ts      # module registry — single source of truth
│   │       ├── chinese/          # module 1
│   │       ├── tasks/            # module 2 (later)
│   │       └── habits/           # module 3 (later)
│   ├── api/                      # route handlers (if not using server actions)
│   ├── globals.css
│   └── layout.tsx
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
│   ├── auth/                     # session + helpers
│   ├── settings/                 # user settings read/write
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
| A new page or route | `app/(app)/modules/<module>/page.tsx` (or `app/(app)/` for top-level) |
| A new life area / module | Add a folder under `app/(app)/modules/<name>/` + `modules/<name>/` for logic + an entry in `app/(app)/modules/_registry.ts` |
| A reusable UI primitive | `components/ui/` (only if it's a shadcn primitive; otherwise `components/<domain>/`) |
| A new shadcn primitive | `npx shadcn@latest add <name>` — never hand-roll. Don't bypass `components.json`. |
| Shell chrome (sidebar, nav) | `components/shell/` |
| A dashboard widget | `components/widgets/` + a widget component referenced from the module's registry entry |
| A theme-aware control (toggle, picker) | `components/<name>.tsx` (root of `components/`) — domain component, not a primitive |
| A theme color / value / palette | `lib/theme/themes.ts` — single source of truth; CSS in `app/globals.css` mirrors it |
| The no-FOUC inline script | `lib/theme/theme-script.ts` — invoked from `app/layout.tsx` `<head>` |
| The `cn()` classname helper | Already wired via `lib/utils.ts` (re-export of the `cn` package). Just import from `@/lib/utils`. |
| Database tables shared by all modules | `lib/db/schema/shared.ts` (e.g. `users`, `settings`, `tags`) |
| Database tables for one module | `lib/db/schema/<module>.ts` (e.g. `chinese_characters`, `chinese_reviews`) — **table names are prefixed by module** |
| A SQL migration | `db/migrations/NNNN_<name>.sql` |
| Domain logic for a module (add/get/log) | `modules/<module>/service.ts` |
| Anything that knows "what's due today" | `lib/scheduler/` — modules plug in via a `dueSource` function |
| Activity / streak logic | `lib/activity/` |
| Auth helpers, session | `lib/auth/` |
| User settings read/write | `lib/settings/` |
| Theme tokens / runtime theme system | `lib/theme/` — see `plans/2026-10-16_1810-install-shadcn-ui-and-theme.md` for the data shape |
| A new project plan | `plans/YYYY-MM-DD_HHMM-<name>.md` + update §4 list |

### shadcn/ui

We use [shadcn/ui](https://ui.shadcn.com/) for UI primitives. The model:
- `npx shadcn@latest init` writes `components.json` (config — committed) and `lib/utils.ts` (`cn` helper).
- `npx shadcn@latest add <name>` drops a copy of the component into `components/ui/`. We OWN the code; we edit it freely.
- The CLI uses `@base-ui/react` (Base UI) for primitives, not Radix UI. Don't replace it.
- **Never bypass `components.json`** — if a primitive needs new config (e.g. a different icon library), update it there.
- Current config: `style: base-nova`, `baseColor: taupe` (preset `b2BXFGesy`), `iconLibrary: lucide`.

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
