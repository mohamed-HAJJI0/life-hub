import { defineConfig } from "vitest/config";

// Node 22+ ships a `localStorage` global (Web Storage). Without
// `--localstorage-file` it is a plain stub, and inside the test environment
// it SHADOWS jsdom's real Storage — so `localStorage.clear()` is not a
// function and every localStorage test fails.
//
// Turning Node's off lets jsdom's Storage through. The flag does not exist
// on older Node versions, hence the guard.
const execArgv = process.allowedNodeEnvironmentFlags.has(
  "--no-experimental-webstorage",
)
  ? ["--no-experimental-webstorage"]
  : [];

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
    // Vitest 4 moved `poolOptions` to top-level options.
    execArgv,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**", "app/**", "components/**"],
    },
  },
});
