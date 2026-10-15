import { afterEach, expect, it, vi } from "vitest";
import { readCaregiverDashboard } from "@/features/caregiver/dashboard-query";

afterEach(() => vi.unstubAllGlobals());
it("uses an uncached cancellable GET rather than the Server Action queue", async () => {
  const request = vi.fn().mockResolvedValue(Response.json({ data: [] }));
  vi.stubGlobal("fetch", request);
  const controller = new AbortController();
  await expect(
    readCaregiverDashboard(
      "activity",
      { kind: "relationship", relationshipId: "id&other=value" },
      controller.signal,
    ),
  ).resolves.toEqual([]);
  expect(request).toHaveBeenCalledWith(
    "/api/caregiver/dashboard?resource=activity&relationshipId=id%26other%3Dvalue",
    {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    },
  );
});
it.each([
  Response.json({}, { status: 200 }),
  new Response("expired", { status: 401 }),
])(
  "does not turn an error or empty response into an empty shared space",
  async (response) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
    await expect(readCaregiverDashboard("patients")).rejects.toThrow(
      "common.actionFailed",
    );
  },
);
