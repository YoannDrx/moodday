import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "../app/api/auth/logout/route";

const transaction = prisma;

const requestFor = ({
  cookie,
  origin = "https://moodday.test",
  host = "moodday.test",
  deviceId,
  body = "intent=sign-out",
}: {
  cookie?: string;
  origin?: string | null;
  host?: string | null;
  deviceId?: string;
  body?: string;
} = {}) => {
  const values = new Map<string, string>([["x-forwarded-proto", "https"]]);
  if (cookie) values.set("cookie", cookie);
  if (origin) values.set("origin", origin);
  if (host) values.set("host", host);

  return {
    url: `http://internal.test/api/auth/logout${deviceId ? `?deviceId=${deviceId}` : ""}`,
    headers: { get: (name: string) => values.get(name) ?? null },
    text: async () => body,
  } as Request;
};

describe("logout route", () => {
  beforeEach(() => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      typeof callback === "function"
        ? callback(transaction as never)
        : Promise.all(callback),
    );
  });

  it("rejects cross-origin requests before reading the session", async () => {
    const response = await POST(
      requestFor({ origin: "https://attacker.test" }),
    );

    expect(response.status).toBe(403);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects missing, malformed, and oversized logout intents", async () => {
    const missing = await POST(requestFor({ body: "" }));
    const malformed = await POST(requestFor({ body: "intent=keep-session" }));
    const oversized = await POST(requestFor({ body: "x".repeat(257) }));

    expect(missing.status).toBe(400);
    expect(malformed.status).toBe(400);
    expect(oversized.status).toBe(413);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("deletes the current session and only the matching push device", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue({
      userId: "user-1",
    } as never);
    vi.mocked(prisma.pushSubscription.deleteMany).mockResolvedValue({
      count: 1,
    });
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 1 });
    const longDeviceId = "d".repeat(200);

    const response = await POST(
      requestFor({
        cookie:
          "unrelated=keep; moodday.session_token=session-token.signature; __Secure-moodday.session_data=secret",
        deviceId: longDeviceId,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://moodday.test/auth/signin",
    );
    expect(prisma.session.findUnique).toHaveBeenCalledWith({
      where: { token: "session-token" },
      select: { userId: true },
    });
    expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", deviceId: "d".repeat(128) },
    });
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { token: "session-token" },
    });

    const clearedCookies = response.headers.getSetCookie().join("\n");
    expect(clearedCookies).toContain("moodday.session_token=");
    expect(clearedCookies).toContain("__Secure-moodday.session_data=");
    expect(clearedCookies).toContain("Secure");
    expect(clearedCookies).not.toContain("unrelated=");
  });

  it("still revokes the token when its user session is already absent", async () => {
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 0 });

    const response = await POST(
      requestFor({
        cookie: "moodday.session_token=orphaned.signature",
        deviceId: "device-1",
      }),
    );

    expect(response.status).toBe(303);
    expect(prisma.pushSubscription.deleteMany).not.toHaveBeenCalled();
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { token: "orphaned" },
    });
  });

  it("treats malformed or absent cookies as an already signed-out request", async () => {
    const malformed = await POST(
      requestFor({ cookie: "broken; moodday.session_token=%E0%A4%A" }),
    );
    const absent = await POST(
      requestFor({ cookie: undefined, origin: null, host: null }),
    );

    expect(malformed.status).toBe(303);
    expect(absent.status).toBe(303);
    expect(absent.headers.get("location")).toBe(
      "http://internal.test/auth/signin",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
