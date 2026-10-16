// No-FOUC inline <script>. Injected into <head> before React hydrates so
// the user never sees a flash of the default theme.
//
// The script:
//   1. Reads localStorage["life-hub:theme"] (must be the v3 shape — old
//      shapes are migrated by the React hook on mount, not here, because
//      the migration helper lives in TS and the inline script is plain JS).
//   2. Resolves the user's modePref ("light" | "dark" | "system") to a
//      concrete mode using prefers-color-scheme when system is selected.
//   3. Sets the 4 data attributes + .dark class on <html> in one function
//      so they can never drift out of sync.
//   4. Subscribes to prefers-color-scheme changes so live OS changes still
//      get applied before React's hook takes over (it adds its own listener).
//
// If localStorage is unavailable, missing, or holds an unparseable value,
// the script silently falls through to the SSR defaults (set on <html> by
// the root layout).

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

const setModeFn = `function(mode, base, accent, chart){
  var r=document.documentElement;
  r.setAttribute('data-base', base);
  r.setAttribute('data-accent', accent);
  r.setAttribute('data-chart', chart);
  r.setAttribute('data-mode', mode);
  if (mode === 'dark') r.classList.add('dark');
  else r.classList.remove('dark');
}`;

export const themeScript = `(function(){
  try {
    var KEY=${keyLiteral};
    var DF_BASE=${defaultBase}, DF_ACCENT=${defaultAccent}, DF_CHART=${defaultChart}, DF_MODE=${defaultModePref};
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    var cfg = null;
    if (raw) {
      try {
        var p = JSON.parse(raw);
        if (p && typeof p === 'object'
            && typeof p.base === 'string'
            && typeof p.accent === 'string'
            && typeof p.chart === 'string'
            && (p.modePref === 'light' || p.modePref === 'dark' || p.modePref === 'system')) {
          cfg = p;
        }
      } catch (e) {}
    }
    if (!cfg) {
      cfg = { base: DF_BASE, accent: DF_ACCENT, chart: DF_CHART, modePref: DF_MODE };
    }
    var mode = cfg.modePref;
    if (mode === 'system' || mode == null) {
      mode = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    ${setModeFn}(mode, cfg.base, cfg.accent, cfg.chart);

    if (window.matchMedia) {
      var mql = window.matchMedia('(prefers-color-scheme: dark)');
      var lastMode = mode;
      var onChange = function() {
        try {
          var r2 = null;
          try { r2 = localStorage.getItem(KEY); } catch (e) {}
          var c2 = null;
          if (r2) {
            try {
              var p2 = JSON.parse(r2);
              if (p2 && typeof p2 === 'object' && typeof p2.base === 'string'
                  && typeof p2.accent === 'string' && typeof p2.chart === 'string'
                  && (p2.modePref === 'light' || p2.modePref === 'dark' || p2.modePref === 'system')) {
                c2 = p2;
              }
            } catch (e) {}
          }
          if (!c2) c2 = { base: DF_BASE, accent: DF_ACCENT, chart: DF_CHART, modePref: DF_MODE };
          if (c2.modePref !== 'system') return;
          var m2 = mql.matches ? 'dark' : 'light';
          if (m2 === lastMode) return;
          lastMode = m2;
          ${setModeFn}(m2, c2.base, c2.accent, c2.chart);
        } catch (_) {}
      };
      if (mql.addEventListener) mql.addEventListener('change', onChange);
    }
  } catch (e) {
    try {
      ${setModeFn}('light', ${defaultBase}, ${defaultAccent}, ${defaultChart});
    } catch (_) {}
  }
})();`;
