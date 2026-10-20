import { defineConfig } from "vitest/config";

// Vitest config.
//
// The environment is `node` by default — most of this app's logic is
// server-side and pure. The few component tests opt into jsdom with a
// `// @vitest-environment jsdom` docblock at the top of the file, which
// keeps the jsdom cost off the unit runs.
//
// `resolve.tsconfigPaths` wires the `@/*` alias from tsconfig.json, so tests
// import app code exactly the way the app does.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**", "app/**", "components/**"],
    },
  },
});
