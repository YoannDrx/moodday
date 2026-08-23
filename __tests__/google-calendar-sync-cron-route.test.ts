import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  validateCronRequest: vi.fn(),
  getFeatureAvailability: vi.fn(),
  runOperationalJob: vi.fn(),
  synchronizeDueGoogleCalendars: vi.fn(),
}));

vi.mock("@/lib/cron", () => ({
  validateCronRequest: mocks.validateCronRequest,
}));
vi.mock("@/lib/features/availability", () => ({
  getFeatureAvailability: mocks.getFeatureAvailability,
}));
vi.mock("@/lib/operations/job-runner", () => ({
  runOperationalJob: mocks.runOperationalJob,
}));
vi.mock("@/features/v2/calendar/background-sync", () => ({
  synchronizeDueGoogleCalendars: mocks.synchronizeDueGoogleCalendars,
}));

import { GET } from "../app/api/cron/google-calendar-sync/route";

const request = new Request("http://localhost/api/cron/google-calendar-sync");
const callRoute = () => GET(request, {} as never);

describe("Google Calendar sync cron route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.validateCronRequest.mockReturnValue(null);
    mocks.getFeatureAvailability.mockReturnValue({
      enabled: true,
      reason: "available",
    });
    mocks.synchronizeDueGoogleCalendars.mockResolvedValue({
      examined: 2,
      synchronized: 2,
      remaining: false,
    });
    mocks.runOperationalJob.mockImplementation(
      async ({ task }: { task: () => Promise<unknown> }) => ({
        skipped: false,
        result: await task(),
      }),
    );
  });

  it("rejects unauthorized calls before checking the feature", async () => {
    mocks.validateCronRequest.mockReturnValue(
      Response.json({ error: "unauthorized" }, { status: 401 }),
    );

    const response = await callRoute();
    expect(response.status).toBe(401);
    expect(mocks.getFeatureAvailability).not.toHaveBeenCalled();
  });

  it("stays disabled while configuration is incomplete", async () => {
    mocks.getFeatureAvailability.mockReturnValue({
      enabled: false,
      reason: "incomplete_configuration",
    });

    expect(await (await callRoute()).json()).toEqual({
      ok: true,
      disabled: true,
      reason: "incomplete_configuration",
    });
    expect(mocks.runOperationalJob).not.toHaveBeenCalled();
  });

  it("runs one content-free, idempotent batch every fifteen minutes", async () => {
    expect(await (await callRoute()).json()).toEqual({
      ok: true,
      examined: 2,
      synchronized: 2,
      remaining: false,
    });
    expect(mocks.runOperationalJob).toHaveBeenCalledWith({
      jobName: "google-calendar-sync",
      intervalMs: 15 * 60 * 1000,
      task: expect.any(Function),
    });
  });

  it("reports an already claimed interval as skipped", async () => {
    mocks.runOperationalJob.mockResolvedValue({
      skipped: true,
      reason: "already_claimed",
    });
    expect(await (await callRoute()).json()).toEqual({
      ok: true,
      skipped: true,
    });
  });
});
