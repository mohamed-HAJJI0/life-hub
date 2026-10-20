// No-FOUC inline <script>. Injected into <head> before React hydrates so
// the user never sees a flash of the wrong theme.
//
// The script:
//   1. Reads localStorage["life-hub:theme"] (must be the v3 shape — old
//      shapes are migrated by the React hook on mount, not here, because
//      the migration helper lives in TS and the inline script is plain JS).
//   2. If there is NO local theme on this device, falls back to the theme
//      the server already rendered onto <html> (the account-wide theme from
//      the database) — read from the data-* attributes. It must NOT
//      overwrite those with hardcoded defaults, or a new device would
//      ignore the user's saved theme.
//   3. Resolves the modePref ("light" | "dark" | "system") to a concrete
//      mode using prefers-color-scheme when system is selected.
//   4. Sets the 4 data attributes + .dark class on <html> in one function
//      so they can never drift out of sync.
//   5. Subscribes to prefers-color-scheme changes so live OS changes still
//      get applied before React's hook takes over (it adds its own listener).
//
// If localStorage is unavailable, missing, or holds an unparseable value,
// the script falls back to the server-rendered attributes, and only then to
// the built-in defaults.

import {
  DEFAULT_BASE,
  DEFAULT_ACCENT,
  DEFAULT_CHART,
  DEFAULT_MODE_PREF,
  STORAGE_KEY,
} from "./constants";

const keyLiteral = JSON.stringify(STORAGE_KEY);
const defaultBase = JSON.stringify(DEFAULT_BASE);
const defaultAccent = JSON.stringify(DEFAULT_ACCENT);
const defaultChart = JSON.stringify(DEFAULT_CHART);
const defaultModePref = JSON.stringify(DEFAULT_MODE_PREF);

// NOTE: these are assigned to a `var` on purpose. A bare
// `function (…) {…}` at statement position is a FunctionDeclaration, and
// an anonymous one is a SyntaxError — the whole inline script would fail
// to parse and silently never run. Assigning to a var makes it a Function
// EXPRESSION, which is valid anywhere.
const setModeFn = `var __setMode = function(mode, base, accent, chart){
  var r=document.documentElement;
  r.setAttribute('data-base', base);
  r.setAttribute('data-accent', accent);
  r.setAttribute('data-chart', chart);
  r.setAttribute('data-mode', mode);
  if (mode === 'dark') r.classList.add('dark');
  else r.classList.remove('dark');
};`;

/**
 * Reads the theme, preferring the device-local localStorage copy and
 * falling back to the server-rendered (account-wide) attributes.
 *
 * `readLocal()` parses + validates the stored v3 shape. `readAttr(n)`
 * reads an attribute the server put on <html>.
 */
const readThemeFn = `var __readTheme = function(DF_BASE, DF_ACCENT, DF_CHART, DF_MODE){
  var KEY=${keyLiteral};
  var r=document.documentElement;
  function readAttr(n){ try { return r.getAttribute(n); } catch(e){ return null; } }
  function readLocal(){
    var raw=null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!raw) return null;
    try {
      var p = JSON.parse(raw);
      if (p && typeof p === 'object'
          && typeof p.base === 'string'
          && typeof p.accent === 'string'
          && typeof p.chart === 'string'
          && (p.modePref === 'light' || p.modePref === 'dark' || p.modePref === 'system')) {
        return p;
      }
    } catch (e) {}
    return null;
  }
  var local = readLocal();
  if (local) {
    return { base: local.base, accent: local.accent, chart: local.chart, modePref: local.modePref };
  }
  // No device-local theme: the server rendered the account-wide one.
  return {
    base: readAttr('data-base') || DF_BASE,
    accent: readAttr('data-accent') || DF_ACCENT,
    chart: readAttr('data-chart') || DF_CHART,
    modePref: readAttr('data-mode-pref') || DF_MODE
  };
};`;

export const themeScript = `(function(){
  try {
    var DF_BASE=${defaultBase}, DF_ACCENT=${defaultAccent}, DF_CHART=${defaultChart}, DF_MODE=${defaultModePref};
    ${readThemeFn}
    ${setModeFn}

    function apply(){
      var cfg = __readTheme(DF_BASE, DF_ACCENT, DF_CHART, DF_MODE);
      var mode = cfg.modePref;
      if (mode === 'system' || mode == null) {
        mode = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      }
      __setMode(mode, cfg.base, cfg.accent, cfg.chart);
      return mode;
    }

    var lastMode = apply();

    if (window.matchMedia) {
      var mql = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function() {
        try {
          var cfg = __readTheme(DF_BASE, DF_ACCENT, DF_CHART, DF_MODE);
          if (cfg.modePref !== 'system') return;
          var m2 = mql.matches ? 'dark' : 'light';
          if (m2 === lastMode) return;
          lastMode = m2;
          __setMode(m2, cfg.base, cfg.accent, cfg.chart);
        } catch (_) {}
      };
      if (mql.addEventListener) mql.addEventListener('change', onChange);
    }
  } catch (e) {
    try {
      __setMode('light', ${defaultBase}, ${defaultAccent}, ${defaultChart});
    } catch (_) {}
  }
})();`;
