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
      include: ["app/**/*.{ts,tsx}", "src/**/*.{ts,tsx}"],
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
      thresholds: enforceReleaseCoverage
        ? {
            statements: 80,
            branches: 70,
            lines: 80,
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
            "src/features/pwa/offline-store.ts": { branches: 90 },
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
            "app/api/auth/**/route.ts": { branches: 90 },
            "app/api/export/json/route.ts": { branches: 90 },
            "app/api/export/pdf/route.ts": { branches: 90 },
            "app/api/regulatory-export/**/route.ts": {
              branches: 90,
            },
            "app/api/webhooks/**/*.ts": { branches: 90 },
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
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@email": path.resolve(__dirname, "./emails"),
      "@app": path.resolve(__dirname, "./app"),
      "@test": path.resolve(__dirname, "./test"),
    },
  },
});
