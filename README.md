# Life Hub

A personal life dashboard — one home for every life area (Chinese, tasks,
habits, health…), with a shared "what's due today" view across all of them.

Built as a set of independent **apps** (Next.js route groups / root folders),
each owning its own modules, sharing a common shell, database and scheduler.

> **Working rules live in [`AGENTS.md`](./AGENTS.md).** Read it before making
> any change — it defines the file layout, the plan-then-apply loop, and the
> commit cadence. Project plans live in `plans/` (gitignored).

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Cache Components) |
| UI | [shadcn/ui](https://ui.shadcn.com) — `base-nova` style, `taupe` base color, Base UI primitives, lucide icons |
| Auth | [Clerk](https://clerk.com) — `proxy.ts` middleware gate, no hand-rolled session code |
| Database | [Neon](https://neon.tech) Postgres via [Drizzle ORM](https://orm.drizzle.team) |
| Language | TypeScript (strict), Tailwind CSS 4 |

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

### Environment variables

`.env.local` (gitignored). Next.js loads it automatically; **drizzle-kit does
not** — `drizzle.config.ts` loads it explicitly via `dotenv`.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | yes | Clerk client key |
| `CLERK_SECRET_KEY` | yes | Clerk server key |
| `DATABASE_URL` | yes | Neon **pooled** connection string, e.g. `postgresql://user:pass@host/db?sslmode=require` |

Clerk dev keys are written to `.env.local` by:

```bash
npx -y clerk@latest init --no-skills   # accountless dev mode — no account needed
```

To claim the app for production later:

```bash
npx -y clerk@latest auth login
npx -y clerk@latest env pull --instance prod
```

### Database

Migrations are **generated**, never hand-written, and tracked in git under
`db/migrations/`.

```bash
npx drizzle-kit generate --name <name>   # writes db/migrations/NNNN_<name>.sql
npx drizzle-kit migrate                  # applies pending migrations
npx drizzle-kit studio                   # browse the data
```

Shared tables live in `lib/db/schema/shared.ts`; per-module tables get their
own file and are prefixed by module name (`chinese_characters`, …). Every
table name the app owns is listed in **`lib/db/tables.ts`** — change it there
and the schema, the queries and the next migration all follow.

> **The database is shared with another app.** `public` also holds `courses`,
> `posts`, `post-content`, `submissions` and `accepted-ids`. Life Hub does not
> model them — that is deliberate, and it is what stops `drizzle-kit` from
> ever proposing to drop them. The `users` table belongs to that app too; we
> extend it with an `auth_id` column (the Clerk user id) and use that as our
> key.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (also type-checks) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `node scripts/verify-theme-tokens.mjs` | Re-fetches the live shadcn registry and verifies every theme token (expect `PASS: 174 / FAIL: 0`) |

---

## Theme system

`lib/theme/` implements a shadcn-style runtime theme editor: **7 bases × 24
accents × 24 chart palettes × light / dark / system**.

- Colors come from the live shadcn registry, pinned into
  `lib/theme/shadcn-data.json` by `scripts/fetch-shadcn-data.mjs`.
- `app/theme-tokens.css` is generated from that JSON by
  `scripts/generate-theme-css.mjs` — never hand-edit it.
- An inline `<head>` script applies the saved theme **before first paint**, so
  there is no flash of the wrong theme.

Theme is stored in **two** places, with a fixed precedence:

- `localStorage["life-hub:theme"]` — the **per-device** choice. The inline
  script can only read this before first paint, so it wins on the device where
  you made the change.
- `settings.theme_*` in the database — the **account-wide** default. The server
  renders it onto `<html>`, so a new device starts on the right theme with no
  flash.

Language and timezone live only in the database.

Rebuild and verify:

```bash
node scripts/fetch-shadcn-data.mjs
node scripts/generate-theme-css.mjs
node scripts/verify-theme-tokens.mjs   # registry values: PASS 174 / FAIL 0
node scripts/test-theme-script.mjs      # no-FOUC script: ALL CHECKS PASSED
node scripts/test-hash-guard.mjs        # Clerk tab state: ALL CHECKS PASSED
```

---

## Where things go

`AGENTS.md` §5 is the canonical map. The short version:

| Thing | Location |
|---|---|
| Routes | `app/` — thin, server components by default |
| A module of app X | `app/X/modules/<name>/page.tsx` (UI) + `modules/<name>/service.ts` (logic) |
| A module registry | `app/X/modules/_registry.ts` — one per app, never global |
| Shared UI | `components/ui/` (shadcn) and `components/shell/` (shell chrome) |
| Shared infra | `lib/` — `db/`, `settings/`, `time/`, `i18n/`, `theme/`, `scheduler/`, `activity/` |
| Migrations | `db/migrations/` |

---

## Roadmap

Build order (from `plans/2026-10-16_1608-project-plan-and-structure.md`):

1. ✅ Auth + shell + settings
2. ⬜ Module registry + empty dashboard
3. ⬜ Chinese module v1
4. ⬜ Generic scheduler
5. ⬜ Today view (aggregate)
6. ⬜ Second module (tasks or habits) — proves the base is reusable

PWA setup and JSON export are hygiene, not polish — both ship before step 6.
