import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getRequiredUser: vi.fn(),
  createUserDataExportStream: vi.fn(),
  enforceRateLimit: vi.fn(),
  getI18n: vi.fn(),
}));

vi.mock("@/lib/auth/auth-user", () => ({
  getSession: mocks.getSession,
  getRequiredUser: mocks.getRequiredUser,
  RECENT_AUTHENTICATION_WINDOW_MS: 10 * 60 * 1_000,
}));
vi.mock("@/features/account/user-data-export", () => ({
  createUserDataExportStream: mocks.createUserDataExportStream,
}));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
}));
vi.mock("@/i18n/server", () => ({ getI18n: mocks.getI18n }));

import { GET as getJsonExport } from "@app/api/export/json/route";

describe("export routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRequiredUser.mockResolvedValue({ id: "user-1" });
    mocks.createUserDataExportStream.mockImplementation(
      () =>
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode("{}"));
            controller.close();
          },
        }),
    );
    mocks.getI18n.mockResolvedValue({ locale: "fr", t: vi.fn() });
  });

  it("rejects a JSON export without an authenticated session", async () => {
    mocks.getSession.mockResolvedValue(null);
    const response = await getJsonExport();
    expect(response.status).toBe(401);
    expect(mocks.getRequiredUser).not.toHaveBeenCalled();
  });

  it.each(["invalid-date", new Date(Date.now() - 11 * 60 * 1_000)])(
    "requires recent authentication for JSON export: %s",
    async (createdAt) => {
      mocks.getSession.mockResolvedValue({
        user: { id: "user-1" },
        session: { createdAt },
      });
      const response = await getJsonExport();
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        code: "recent_authentication_required",
      });
    },
  );

  it("streams a no-store JSON export after rate limiting", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "user-1" },
      session: { createdAt: new Date() },
    });
    const response = await getJsonExport();
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("{}");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("content-disposition")).toMatch(
      /moodday-export-\d{4}-\d{2}-\d{2}\.json/u,
    );
    expect(mocks.enforceRateLimit).toHaveBeenCalledWith({
      scope: "full-data-export",
      identifier: "user-1",
      max: 3,
      windowSeconds: 60 * 60,
    });
  });
});
