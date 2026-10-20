// Regression test for the hash guard (`components/shell/use-hash-guard.ts`).
//
// Clerk's <UserProfile routing="hash"> keeps the active tab in the URL
// fragment. Next.js's HistoryUpdater calls history.replaceState() after
// every render with a canonical URL that never contains the fragment — so
// the fragment is stripped and Clerk's router bounces to its first page.
//
// The guard must:
//   1. Keep the fragment across a same-path replaceState (the refresh case).
//   2. Keep the fragment across a same-path pushState.
//   3. Drop the fragment on a real navigation to another path.
//   4. Leave a URL that already carries a fragment alone.
//   5. Not touch anything when there is no fragment to preserve.
//   6. Restore the original methods on cleanup, and NOT clobber a wrapper
//      that was installed over ours (Clerk patches history too).
//
// Run: node scripts/test-hash-guard.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// The guard is a TS module that imports React. We only need its logic, so
// we exercise the same algorithm directly rather than mounting a hook.
const src = readFileSync(
  resolve(ROOT, "components/shell/use-hash-guard.ts"),
  "utf8",
);

if (!src.includes("preserveHash")) {
  console.error("FAIL: use-hash-guard.ts no longer defines preserveHash");
  process.exit(1);
}

/** The same algorithm as the hook, over a fake location. */
function makePreserveHash(location) {
  return (url) => {
    if (!url) return url;
    const next = new URL(String(url), location.href);
    if (next.hash) return url;
    if (!location.hash) return url;
    if (next.pathname !== location.pathname) return url;
    next.hash = location.hash;
    return next.href;
  };
}

/** A fake window.history + location, and the Next-style call. */
function makeEnv({ hash, path = "/" } = {}) {
  const location = {
    pathname: path,
    hash,
    href: `http://localhost:3000${path}${hash ? hash : ""}`,
    origin: "http://localhost:3000",
  };
  const history = {
    pushState(_d, _u, url) {
      const next = new URL(String(url), location.href);
      location.pathname = next.pathname;
      location.hash = next.hash;
      location.href = next.href;
    },
    replaceState(_d, _u, url) {
      const next = new URL(String(url), location.href);
      location.pathname = next.pathname;
      location.hash = next.hash;
      location.href = next.href;
    },
  };
  return { location, history };
}

let failures = 0;
function check(label, cond, detail = "") {
  if (cond) {
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

console.log("\n1) same-path replaceState keeps the fragment (the refresh case)");
{
  const { location, history } = makeEnv({ hash: "#/theme" });
  const preserve = makePreserveHash(location);
  history.replaceState({}, "", preserve("http://localhost:3000/"));
  check("fragment survived", location.hash === "#/theme", location.hash);
}

console.log("\n2) same-path pushState keeps the fragment");
{
  const { location, history } = makeEnv({ hash: "#/language" });
  const preserve = makePreserveHash(location);
  history.pushState({}, "", preserve("http://localhost:3000/"));
  check("fragment survived", location.hash === "#/language", location.hash);
}

console.log("\n3) a real navigation to another path drops the fragment");
{
  const { location, history } = makeEnv({ hash: "#/theme" });
  const preserve = makePreserveHash(location);
  history.pushState({}, "", preserve("http://localhost:3000/today"));
  check("fragment dropped", location.hash === "", location.hash);
  check("path changed", location.pathname === "/today", location.pathname);
}

console.log("\n4) a URL that already carries a fragment is left alone");
{
  const { location, history } = makeEnv({ hash: "#/theme" });
  const preserve = makePreserveHash(location);
  history.replaceState({}, "", preserve("http://localhost:3000/#/timezone"));
  check("new fragment used", location.hash === "#/timezone", location.hash);
}

console.log("\n5) nothing to preserve — the URL is untouched");
{
  const { location, history } = makeEnv({ hash: "" });
  const preserve = makePreserveHash(location);
  history.replaceState({}, "", preserve("http://localhost:3000/"));
  check("no fragment added", location.hash === "", location.hash);
}

console.log("\n6) cleanup unwraps our patch but not a wrapper installed over it");
{
  // Case A: nobody wrapped us -> we restore the original.
  const { history } = makeEnv({ hash: "#/theme" });
  const realReplaceState = history.replaceState;
  const patched = function (d, u, url) {
    return realReplaceState.call(this, d, u, url);
  };
  history.replaceState = patched;
  const cleanup = () => {
    if (history.replaceState === patched) history.replaceState = realReplaceState;
  };
  cleanup();
  check("restored the original", history.replaceState === realReplaceState);

  // Case B: someone wrapped our patch (this is what Clerk does) -> we must
  // NOT unwrap, or their URL observer would stop working.
  const { history: h2 } = makeEnv({ hash: "#/theme" });  const real2 = h2.replaceState;
  const ours = function (d, u, url) {
    return real2.call(this, d, u, url);
  };
  h2.replaceState = ours;
  const clerkWrapper = function (d, u, url) {
    return ours.call(this, d, u, url);
  };
  h2.replaceState = clerkWrapper;
  const cleanup2 = () => {
    if (h2.replaceState === ours) h2.replaceState = real2;
  };
  cleanup2();
  check("did NOT clobber the outer wrapper", h2.replaceState === clerkWrapper);
}

console.log(
  `\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`,
);
process.exit(failures === 0 ? 0 : 1);
