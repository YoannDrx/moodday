import { beforeEach, describe, expect, it, vi } from "vitest";

const mutableEnv = vi.hoisted(() => ({
  CRON_SECRET: "cron-test-secret",
  MAINTENANCE_MODE: false,
  NODE_ENV: "production",
}));

vi.mock("@/lib/env", () => ({ env: mutableEnv }));

import { validateCronRequest } from "@/lib/cron";

const request = (secret = mutableEnv.CRON_SECRET) =>
  new Request("https://moodday.invalid/api/cron/notifications", {
    headers: { authorization: `Bearer ${secret}` },
  });

describe("cron request security", () => {
  beforeEach(() => {
    mutableEnv.CRON_SECRET = "cron-test-secret";
    mutableEnv.MAINTENANCE_MODE = false;
    mutableEnv.NODE_ENV = "production";
  });

  it("accepts the configured secret outside maintenance", () => {
    expect(validateCronRequest(request())).toBeNull();
  });

  it("rejects an invalid secret before exposing maintenance state", async () => {
    mutableEnv.MAINTENANCE_MODE = true;

    const response = validateCronRequest(request("invalid"));

    expect(response?.status).toBe(401);
    expect(await response?.json()).toEqual({ error: "Unauthorized" });
  });

  it("defers authenticated jobs without writing during maintenance", async () => {
    mutableEnv.MAINTENANCE_MODE = true;

    const response = validateCronRequest(request());

    expect(response?.status).toBe(503);
    expect(response?.headers.get("retry-after")).toBe("300");
    expect(response?.headers.get("cache-control")).toBe("no-store");
    expect(await response?.json()).toEqual({ error: "Unavailable" });
  });

  it("fails closed in production when the cron secret is absent", async () => {
    mutableEnv.CRON_SECRET = "";

    const response = validateCronRequest(request("anything"));

    expect(response?.status).toBe(503);
    expect(await response?.json()).toEqual({ error: "Unavailable" });
  });
});
