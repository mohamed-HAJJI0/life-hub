# Project Organizing Todo List

> The single source of truth for what still needs to be done in Life Hub.
> Last synced: **2026-10-20** · branch `feacher/main-elements` · **step 1 closed → step 2 next**.
> Build-order detail: `AGENTS.md` §6. Working plans: `plans/`.

---

## 1. Core foundation (do first)

- [x] **Auth + user profile** — user id is the spine of everything. Even single-user at start, so future multi-user / sharing is painless.
  - Clerk (`@clerk/nextjs`), `proxy.ts` gate, `app/(auth)/` pages, `users.auth_id` in the DB
- [x] **Database schema with module separation**
  - [x] Shared tables: `users`, `settings` — `tags` was created then dropped (unused, 2026-10-20)
  - [ ] Per-module tables (e.g. Chinese → `characters`, `reviews`, `sentences`)
  - [x] Prefix or group tables by module name
- [x] **App shell**
  - [x] Layout
  - [x] Sidebar / nav listing modules — the sidebar exists; its nav list is still hardcoded and becomes registry-driven in step 2
  - [ ] Home dashboard that will later show "today" across all modules — the page exists, but it is not registry-driven yet (step 2)
- [x] **Settings** — language, timezone, theme.
  - [x] Timezone matters for daily streaks and "due today" logic — wire it early.
  - [x] Theme — per-device `localStorage` override + account-wide `settings.theme_*` in the DB

## 2. Module architecture

- [ ] **Each life area is its own folder** — Chinese, tasks, habits, finance, health…
  - [ ] Own pages, own data logic, own components.
  - [ ] Per-app convention: `app/<app>/modules/` + `app/<app>/modules/_registry.ts` — never one global registry
- [ ] **Module registry** ← **NEXT (step 2)**
  - [ ] `name`, `icon`, `route`, `dashboard widget`
  - [ ] Adding a new module = adding one registry entry
  - [ ] `ModuleDef` type in `lib/types/`
  - Plan: `plans/2026-10-20_1645-module-registry-and-per-app-modules.md`
- [x] **Shared code stays separate from module code** (UI components, utils, db client)

## 3. Shared systems worth planning now

- [ ] **Generic scheduling / spaced-repetition engine**
  - [ ] Not just for Chinese — flashcards, habits, reminders all share "what's due today"
  - [ ] Build it generic from day one
- [ ] **Daily / Today view** — one aggregate page pulling due items from every module
  - `/today` exists as a placeholder
- [ ] **Notifications / reminders** — at least a stub for now
- [ ] **Activity log / stats** — streaks, counts, history
  - Cheap to log from day one, painful to backfill

## 4. Dev hygiene

- [x] **TypeScript, strict mode**
- [x] **Env / config setup** — `.env.example` tracked, `.env.local` gitignored
- [x] **Migrations tracked in git** — `db/migrations/` (`0000_baseline`, `0001_add_auth_id`, `0002_add_settings`)
- [ ] **Backups / export** — JSON export of all user data. It's life data, don't skip. (`lib/export/` does not exist)
- [ ] **PWA setup** — so it works like an app on phone (`public/` is still empty)

## 5. Recommended build order

1. [x] Auth + shell + settings
2. [ ] Module registry + empty dashboard ← **NEXT**
3. [ ] Chinese module v1 — add character, review daily, track misses
4. [ ] Generic scheduler extracted from the Chinese module
5. [ ] Today view (aggregate page)
6. [ ] Second module (tasks or habits) — proves the base actually works
