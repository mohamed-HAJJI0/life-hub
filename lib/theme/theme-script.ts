// No-FOUC inline script. Injected into <head> before React hydrates so the
// user never sees the default theme flash before their saved choice is
// applied.
//
// Why a raw string and not a React component:
//   The script must run synchronously in <head>, BEFORE the browser paints.
//   A raw inline <script> is the most reliable way and has zero runtime cost.
//   The string is built at module-load time, no React on the client side.
//
// Behavior:
//   1. Read `localStorage["life-hub:theme"]`. Expect JSON like `{"id":"zinc"}`.
//   2. If a valid `id` is found, set `<html data-theme="...">` to it.
//   3. Otherwise, set `<html data-theme="taupe">` (the default).
//   4. Always wraps reads in try/catch — localStorage can be disabled
//      (private mode, iframe sandbox, etc.) and we must not break the page.
//
// Per `AGENTS.md` §5: theme data + this script live under `lib/theme/`.

import { DEFAULT_THEME, STORAGE_KEY } from "./themes";

const KEY_LITERAL = JSON.stringify(STORAGE_KEY);
const DEFAULT_LITERAL = JSON.stringify(DEFAULT_THEME);

export const themeScript = `(function(){try{var r=localStorage.getItem(${KEY_LITERAL});var id=${DEFAULT_LITERAL};if(r){try{var p=JSON.parse(r);if(p&&typeof p.id==="string"&&/^[a-z]+$/.test(p.id)){id=p.id;}}catch(e){}}document.documentElement.setAttribute("data-theme",id);}catch(e){document.documentElement.setAttribute("data-theme",${DEFAULT_LITERAL});}})();`;
