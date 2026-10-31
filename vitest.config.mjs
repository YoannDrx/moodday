import path from "path";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const enforceReleaseCoverage =
  process.env.COVERAGE_RELEASE_GATE?.toLowerCase() === "true";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    // happy-dom 21 rejects `animation.finished` on cancel without marking it
    // handled, unlike browsers; framer-motion cancels on unmount. Ignore only
    // that rejection so every other unhandled error still fails the run.
    onUnhandledError: (error) =>
      !(
        error.name === "AbortError" &&
        error.message === "The animation was canceled."
      ),
    setupFiles: [path.resolve(__dirname, "test/vitest.setup.ts")],
    env: {
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123",
      NEXT_PUBLIC_LOG_LEVEL: "6",
      NEXT_PUBLIC_EMAIL_CONTACT: "test@test.com",
      CODELINE_SERVER_URL: "http://localhost:3000",
      IS_REACT_ACT_ENVIRONMENT: "true",
    },
    include: ["__tests__/**/*.[jt]s?(x)"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "**/e2e/**", // Exclude e2e tests
      "**/playwright-tests/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage",
      // Page shells and route-segment workspaces are exercised by the five
      // Playwright projects. Keep the unit-coverage gate focused on shared
      // application code and HTTP handlers instead of counting the same UI a
      // second time through Next.js' filesystem layout.
      include: ["src/**/*.{ts,tsx}", "app/api/**/*.{ts,tsx}"],
      exclude: [
        ".next/**",
        "coverage/**",
        "artifacts/**",
        "src/generated/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/emails/**",
        "**/test/**",
        "**/e2e/**",
      ],
      // Vitest 4 measures V8 coverage with AST-aware remapping, which counts
      // lower than Vitest 3 on the same tests (lines 70.5% vs 78.2%). These
      // floors match the first Vitest 4 measurement; only ever raise them.
      thresholds: enforceReleaseCoverage
        ? {
            statements: 69,
            branches: 62,
            functions: 69,
            lines: 70,
            "src/features/caregiver/authorization.ts": {
              branches: 90,
            },
            "src/features/caregiver/permissions.ts": {
              branches: 90,
            },
            "src/features/export/**/*.ts": { branches: 90 },
            "src/features/account/regulatory-data-export.ts": {
              branches: 90,
            },
            "src/features/account/regulatory-export-delivery.ts": {
              branches: 90,
            },
            "src/features/account/user-data-export.ts": { branches: 90 },
            "src/features/medication/adherence-service.ts": {
              branches: 90,
            },
            "src/features/medication/adherence.ts": {
              branches: 90,
            },
            "src/features/pwa/offline-actions.ts": { branches: 90 },
            "src/features/pwa/offline-diagnostic.ts": { branches: 90 },
            "src/features/pwa/offline-store.ts": { branches: 77 },
            "src/lib/auth.ts": { branches: 90 },
            "src/lib/auth/**/*.ts": { branches: 90 },
            "src/lib/operations/external-deletions.ts": { branches: 90 },
            "src/lib/operations/credential-rotation-evidence.ts": {
              branches: 90,
            },
            "src/lib/operations/release-approval-evidence.ts": {
              branches: 90,
            },
            "src/lib/operations/vercel-environment-audit.ts": {
              branches: 90,
            },
            "app/api/auth/**/route.ts": { branches: 89 },
            "app/api/export/json/route.ts": { branches: 90 },
            "app/api/export/pdf/route.ts": { branches: 90 },
            "app/api/regulatory-export/**/route.ts": {
              branches: 90,
            },
            "app/api/webhooks/**/*.ts": { branches: 88 },
            "src/lib/user/delete-user-data.ts": { branches: 90 },
          }
        : {
            statements: 24,
            branches: 70,
            functions: 60,
            lines: 24,
          },
    },
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@email": path.resolve(__dirname, "./emails"),
      "@app": path.resolve(__dirname, "./app"),
      "@test": path.resolve(__dirname, "./test"),
    },
  },
});
