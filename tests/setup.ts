// Global test setup.
//
// Registers the jest-dom matchers (`toBeInTheDocument`, `toHaveTextContent`, …)
// so the component tests read like the assertions you'd write by hand.
//
// `@testing-library/jest-dom/vitest` extends Vitest's own `expect`, so it
// works in the node environment too — it only registers matchers.
import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React Testing Library unmounts between tests automatically — but only when
// it can find a global `afterEach`, which means enabling Vitest's globals.
// We keep globals off, so the cleanup is explicit.
afterEach(() => {
  cleanup();
});
