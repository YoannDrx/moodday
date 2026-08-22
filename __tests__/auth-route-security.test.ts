import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ api: { getSession: vi.fn() } }));
const downstreamGet = vi.hoisted(() => vi.fn());
const downstreamPost = vi.hoisted(() => vi.fn());
const claimEmailVerificationToken = vi.hoisted(() => vi.fn());
const isMaintenanceMode = vi.hoisted(() => vi.fn());
const getSignupAccess = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({ auth }));
vi.mock("@/lib/auth/email-verification-replay", () => ({
  claimEmailVerificationToken,
}));
vi.mock("@/lib/maintenance", () => ({ isMaintenanceMode }));
vi.mock("@/lib/auth/signup-access", () => ({ getSignupAccess }));
vi.mock("better-auth/next-js", () => ({
  toNextJsHandler: () => ({ GET: downstreamGet, POST: downstreamPost }),
}));

import { GET, POST } from "../app/api/auth/[...auth]/route";

const request = (
  path: string,
  method: "GET" | "POST" = "POST",
  body?: Record<string, unknown>,
) =>
  new Request(`http://localhost${path}`, {
    method,
    ...(body
      ? {
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
        }
      : {}),
  });

describe("Better Auth route security gates", () => {
  beforeEach(() => {
    auth.api.getSession.mockReset();
    downstreamGet.mockReset();
    downstreamPost.mockReset();
    claimEmailVerificationToken.mockReset();
    isMaintenanceMode.mockReset();
    isMaintenanceMode.mockReturnValue(false);
    getSignupAccess.mockReturnValue({ allowed: true, mode: "public" });
    downstreamGet.mockResolvedValue(Response.json({ downstream: true }));
    downstreamPost.mockResolvedValue(Response.json({ downstream: true }));
    claimEmailVerificationToken.mockResolvedValue(true);
  });

  it("blocks auth mutations during maintenance while preserving sign-out", async () => {
    isMaintenanceMode.mockReturnValue(true);

    const blocked = await POST(request("/api/auth/sign-in/email"));
    expect(blocked.status).toBe(503);
    expect(blocked.headers.get("retry-after")).toBe("300");
    expect(await blocked.json()).toEqual({
      error: "Moodday is temporarily in maintenance mode",
    });
    expect(downstreamPost).not.toHaveBeenCalled();

    expect((await POST(request("/api/auth/sign-out"))).status).toBe(200);
    expect(downstreamPost).toHaveBeenCalledOnce();
  });

  it.each([
    "/api/auth/change-email",
    "/api/auth/delete-user",
    "/api/auth/passkey/delete-passkey",
    "/api/auth/passkey/update-passkey",
    "/api/auth/two-factor/enable",
    "/api/auth/two-factor/disable",
    "/api/auth/two-factor/generate-backup-codes",
    "/api/auth/two-factor/view-backup-codes",
  ])("requires a current identity for %s", async (path) => {
    auth.api.getSession.mockResolvedValue(null);

    const response = await POST(request(path));

    expect(response.status).toBe(401);
    expect(downstreamPost).not.toHaveBeenCalled();
  });

  it("rejects stale sessions before a sensitive handler can mutate state", async () => {
    auth.api.getSession.mockResolvedValue({
      user: { id: "user-1" },
      session: { createdAt: new Date(Date.now() - 11 * 60 * 1000) },
    });

    const response = await POST(request("/api/auth/passkey/delete-passkey"));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Recent authentication required",
    });
    expect(downstreamPost).not.toHaveBeenCalled();
  });

  it("forwards recent sensitive requests and ordinary auth requests", async () => {
    auth.api.getSession.mockResolvedValue({
      user: { id: "user-1" },
      session: { createdAt: new Date() },
    });

    expect((await POST(request("/api/auth/two-factor/enable"))).status).toBe(
      200,
    );
    expect((await POST(request("/api/auth/sign-in/email"))).status).toBe(200);
    expect(downstreamPost).toHaveBeenCalledTimes(2);
  });

  it("blocks direct account creation when public signup is closed", async () => {
    getSignupAccess.mockReturnValue({
      allowed: false,
      mode: "closed",
      code: "SIGNUP_CLOSED",
    });

    const response = await POST(
      request("/api/auth/sign-up/email", "POST", {
        email: "new@example.test",
      }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({ code: "SIGNUP_CLOSED" });
    expect(downstreamPost).not.toHaveBeenCalled();
  });

  it("allows an invited email to reach Better Auth", async () => {
    getSignupAccess.mockReturnValue({ allowed: true, mode: "invite" });

    const response = await POST(
      request("/api/auth/sign-up/email", "POST", {
        email: "invited@example.test",
      }),
    );

    expect(response.status).toBe(200);
    expect(getSignupAccess).toHaveBeenCalledWith("invited@example.test");
    expect(downstreamPost).toHaveBeenCalledOnce();
  });

  it("claims verification links once before forwarding them", async () => {
    const firstRequest = request(
      "/api/auth/verify-email?token=signed-token&callbackURL=/dashboard",
      "GET",
    );
    expect((await GET(firstRequest)).status).toBe(200);
    expect(claimEmailVerificationToken).toHaveBeenCalledWith("signed-token");
    expect(downstreamGet).toHaveBeenCalledTimes(1);

    claimEmailVerificationToken.mockResolvedValue(false);
    const replay = await GET(
      request("/api/auth/verify-email?token=signed-token", "GET"),
    );
    expect(replay.status).toBe(400);
    expect(downstreamGet).toHaveBeenCalledTimes(1);
  });

  it("forwards non-verification GET requests without creating a claim", async () => {
    expect((await GET(request("/api/auth/get-session", "GET"))).status).toBe(
      200,
    );
    expect(claimEmailVerificationToken).not.toHaveBeenCalled();
  });
});
