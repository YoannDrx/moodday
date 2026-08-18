import { sendEmail } from "@/lib/mail/send-email";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/mail/send-email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/server-url", () => ({
  getServerUrl: () => "https://moodday.example",
}));
vi.mock("@email/auth/new-sign-in", () => ({
  default: (props: unknown) => props,
}));

import {
  getApproximateSessionDevice,
  isSignificantNewSession,
  notifySignificantNewSession,
} from "@/lib/auth/new-session-alert";

const session = {
  id: "session-new",
  userId: "user-1",
  userAgent: "Mozilla/5.0 Chrome/140",
  ipAddress: "192.0.2.42",
  createdAt: new Date("2026-08-14T10:00:00.000Z"),
};

describe("new session alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendEmail).mockResolvedValue({
      error: null,
      data: { id: "email-1" },
    });
  });

  it("classifies only approximate device families for localized emails", () => {
    expect(getApproximateSessionDevice(null, "fr")).toBe("un appareil inconnu");
    expect(getApproximateSessionDevice(null, "en")).toBe("an unknown device");
    expect(getApproximateSessionDevice("Mozilla iPhone Safari", "fr")).toBe(
      "Safari (iPhone/iPad)",
    );
    expect(getApproximateSessionDevice("Mozilla Android Chrome", "en")).toBe(
      "an Android device",
    );
    expect(getApproximateSessionDevice("Mozilla Firefox", "fr")).toBe(
      "Firefox",
    );
    expect(getApproximateSessionDevice("Mozilla Edg", "fr")).toBe(
      "Microsoft Edge",
    );
    expect(getApproximateSessionDevice("Mozilla Chrome", "fr")).toBe(
      "Google Chrome",
    );
    expect(getApproximateSessionDevice("Mozilla Safari", "fr")).toBe("Safari");
    expect(getApproximateSessionDevice("Custom", "en")).toBe("a web browser");
  });

  it("skips a first or already known device/network pair", () => {
    expect(isSignificantNewSession(session, [])).toBe(false);
    expect(
      isSignificantNewSession(session, [
        { userAgent: "Chrome/139", ipAddress: "192.0.2.99" },
      ]),
    ).toBe(false);
    expect(
      isSignificantNewSession({ userAgent: null, ipAddress: null }, [
        { userAgent: null, ipAddress: null },
      ]),
    ).toBe(false);
  });

  it("detects a different device or bounded IPv4/IPv6 network group", () => {
    expect(
      isSignificantNewSession(session, [
        { userAgent: "Mozilla Firefox", ipAddress: "192.0.2.42" },
      ]),
    ).toBe(true);
    expect(
      isSignificantNewSession(session, [
        { userAgent: "Mozilla Chrome", ipAddress: "198.51.100.1" },
      ]),
    ).toBe(true);
    expect(
      isSignificantNewSession(
        { userAgent: "Mozilla Safari", ipAddress: "2001:db8:1:2::9" },
        [{ userAgent: "Mozilla Safari", ipAddress: "2001:db8:1:2::4" }],
      ),
    ).toBe(false);
    expect(
      isSignificantNewSession({ userAgent: "Custom", ipAddress: "not-an-ip" }, [
        { userAgent: "Custom", ipAddress: "also-invalid" },
      ]),
    ).toBe(false);
  });

  it("sends a generic localized alert only to a verified user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      email: "patient@example.test",
      emailVerified: true,
      preferences: { locale: "fr", timezone: "Europe/Paris" },
    } as never);
    vi.mocked(prisma.session.findMany).mockResolvedValue([
      { userAgent: "Mozilla Firefox", ipAddress: "198.51.100.4" },
    ] as never);

    await expect(notifySignificantNewSession(session)).resolves.toEqual({
      sent: true,
    });
    expect(sendEmail).toHaveBeenCalledWith({
      to: "patient@example.test",
      subject: "Nouvelle connexion à votre compte Moodday",
      html: expect.objectContaining({
        locale: "fr",
        device: "Google Chrome",
        securityUrl: "https://moodday.example/settings/security",
      }),
      tracking: { template: "new-sign-in", userId: "user-1" },
    });
  });

  it("skips unverified identities and surfaces provider failures without secrets", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      email: "unverified@example.test",
      emailVerified: false,
      preferences: null,
    } as never);
    vi.mocked(prisma.session.findMany).mockResolvedValue([
      { userAgent: "Mozilla Firefox", ipAddress: "198.51.100.4" },
    ] as never);
    await expect(notifySignificantNewSession(session)).resolves.toEqual({
      sent: false,
      reason: "not_significant",
    });
    expect(sendEmail).not.toHaveBeenCalled();

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      email: "verified@example.test",
      emailVerified: true,
      preferences: { locale: "en", timezone: "Invalid/Zone" },
    } as never);
    vi.mocked(sendEmail).mockResolvedValue({
      error: new Error("provider unavailable"),
      data: null,
    });
    await expect(notifySignificantNewSession(session)).rejects.toMatchObject({
      name: "new_session_alert_delivery_failed",
    });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "New sign-in to your Moodday account",
      }),
    );
  });
});
