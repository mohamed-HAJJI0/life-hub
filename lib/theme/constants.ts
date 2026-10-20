// Theme-related constants. Kept in their own file so the no-FOUC <script>
// can import them without pulling in React or other client-side code.

/** localStorage key. */
export const STORAGE_KEY = "life-hub:theme";

/** Default config — used when the user has never picked a theme. */
export const DEFAULT_BASE = "neutral";
export const DEFAULT_ACCENT = "default";
export const DEFAULT_CHART = "default";
export const DEFAULT_MODE_PREF = "system";
