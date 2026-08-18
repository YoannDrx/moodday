import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  validateCronRequest: vi.fn(),
  getFeatureAvailability: vi.fn(),
  runOperationalJob: vi.fn(),
  sendCaregiverAccessDigests: vi.fn(),
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
vi.mock("@/features/caregiver/access-digest", () => ({
  sendCaregiverAccessDigests: mocks.sendCaregiverAccessDigests,
}));

import { GET } from "../app/api/cron/caregiver-access-digests/route";

const request = new Request(
  "http://localhost/api/cron/caregiver-access-digests",
);
const callRoute = () => GET(request, {} as never);

describe("caregiver access digest cron route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.validateCronRequest.mockReturnValue(null);
    mocks.getFeatureAvailability.mockReturnValue({
      enabled: true,
      reason: "available",
    });
    mocks.sendCaregiverAccessDigests.mockResolvedValue({
      examined: 2,
      sent: 1,
      withoutNewAccess: 1,
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

  it("returns an explicit disabled state for incomplete configuration", async () => {
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

  it("runs one daily idempotent job and returns aggregate counts", async () => {
    expect(await (await callRoute()).json()).toEqual({
      ok: true,
      examined: 2,
      sent: 1,
      withoutNewAccess: 1,
    });
    expect(mocks.runOperationalJob).toHaveBeenCalledWith({
      jobName: "caregiver-access-digests",
      intervalMs: 24 * 60 * 60 * 1000,
      task: expect.any(Function),
    });
  });

  it("reports a concurrent or already completed execution as skipped", async () => {
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
