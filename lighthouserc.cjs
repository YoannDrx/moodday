/** @type {import('@lhci/cli').Config} */
module.exports = {
  ci: {
    collect: {
      url: ["http://127.0.0.1:3200/", "http://127.0.0.1:3200/auth/signin"],
      numberOfRuns: 3,
      startServerCommand: "pnpm start -H 127.0.0.1 -p 3200",
      startServerReadyPattern: "Ready|ready",
      startServerReadyTimeout: 60000,
      settings: {
        chromeFlags: "--headless --no-sandbox --disable-dev-shm-usage",
        maxWaitForLoad: 90000,
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "artifacts/lighthouse",
    },
  },
};
