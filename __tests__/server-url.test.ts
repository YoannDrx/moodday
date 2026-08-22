import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPasskeyOrigin,
  getServerUrl,
  getTrustedAuthOrigins,
} from "@/lib/server-url";

const originalEnvironment = { ...process.env };

afterEach(() => {
  vi.unstubAllGlobals();
  process.env = { ...originalEnvironment };
});

const useServerEnvironment = () => vi.stubGlobal("window", undefined);

describe("server URL and authentication origins", () => {
  it("keeps the canonical URL for links while trusting only exact Vercel origins", () => {
    useServerEnvironment();
    process.env.BETTER_AUTH_URL = "https://moodday.app/";
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "moodday-preview-abc.vercel.app";
    process.env.VERCEL_BRANCH_URL = "moodday-git-feature-team.vercel.app";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "moodday-psi.vercel.app";

    expect(getServerUrl()).toBe("https://moodday.app");
    expect(getTrustedAuthOrigins()).toEqual([
      "https://moodday.app",
      "https://moodday-preview-abc.vercel.app",
      "https://moodday-git-feature-team.vercel.app",
      "https://moodday-psi.vercel.app",
      "moodday-preview://",
      "moodday-preview://*",
    ]);
    expect(getTrustedAuthOrigins()).not.toContain("https://*.vercel.app");
  });

  it("keeps native callback schemes distinct between Production and development", () => {
    useServerEnvironment();
    process.env.BETTER_AUTH_URL = "https://moodday.app";
    process.env.VERCEL_ENV = "production";
    expect(getTrustedAuthOrigins()).toContain("moodday://");
    expect(getTrustedAuthOrigins()).not.toContain("moodday-preview://");

    delete process.env.VERCEL_ENV;
    expect(getTrustedAuthOrigins()).toContain("moodday-dev://");
    expect(getTrustedAuthOrigins()).toContain("exp://192.168.*.*:*/**");
  });

  it("binds Preview passkeys to the exact deployment host", () => {
    useServerEnvironment();
    process.env.BETTER_AUTH_URL = "https://moodday.app";
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_URL = "https://moodday-preview-abc.vercel.app/";

    expect(getPasskeyOrigin()).toBe("https://moodday-preview-abc.vercel.app");
  });

  it("keeps Production passkeys on the canonical application origin", () => {
    useServerEnvironment();
    process.env.BETTER_AUTH_URL = "https://moodday.app/";
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_URL = "moodday-build-abc.vercel.app";

    expect(getPasskeyOrigin()).toBe("https://moodday.app");
  });

  it("uses the browser origin without consulting deployment variables", () => {
    vi.stubGlobal("window", {
      location: { origin: "https://current-browser.example" },
    });

    expect(getServerUrl()).toBe("https://current-browser.example");
    expect(getPasskeyOrigin()).toBe("https://current-browser.example");
  });
});
