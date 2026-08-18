import NewSignInEmail from "@email/auth/new-sign-in";
import { sendEmail } from "@/lib/mail/send-email";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";
import { getSafeTimeZone } from "@/lib/temporal/civil-date";

type SessionSignal = {
  id: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
};

export const getApproximateSessionDevice = (
  userAgent: string | null | undefined,
  locale: "fr" | "en",
) => {
  if (!userAgent)
    return locale === "fr" ? "un appareil inconnu" : "an unknown device";
  if (/iphone|ipad/i.test(userAgent)) return "Safari (iPhone/iPad)";
  if (/android/i.test(userAgent))
    return locale === "fr" ? "un appareil Android" : "an Android device";
  if (/firefox/i.test(userAgent)) return "Firefox";
  if (/edg/i.test(userAgent)) return "Microsoft Edge";
  if (/chrome/i.test(userAgent)) return "Google Chrome";
  if (/safari/i.test(userAgent)) return "Safari";
  return locale === "fr" ? "un navigateur web" : "a web browser";
};

const getNetworkGroup = (ipAddress: string | null | undefined) => {
  if (!ipAddress) return "unknown";
  const ipv4 = ipAddress.split(".");
  if (ipv4.length === 4 && ipv4.every((part) => /^\d{1,3}$/.test(part))) {
    return `v4:${ipv4.slice(0, 3).join(".")}`;
  }
  const ipv6 = ipAddress.toLowerCase().split(":");
  return ipv6.length >= 3 ? `v6:${ipv6.slice(0, 4).join(":")}` : "unknown";
};

const getDeviceGroup = (userAgent: string | null | undefined) => {
  if (!userAgent) return "unknown";
  if (/iphone|ipad/i.test(userAgent)) return "ios";
  if (/android/i.test(userAgent)) return "android";
  if (/firefox/i.test(userAgent)) return "firefox";
  if (/edg/i.test(userAgent)) return "edge";
  if (/chrome/i.test(userAgent)) return "chrome";
  if (/safari/i.test(userAgent)) return "safari";
  return "web";
};

export const isSignificantNewSession = (
  current: Pick<SessionSignal, "userAgent" | "ipAddress">,
  previous: Pick<SessionSignal, "userAgent" | "ipAddress">[],
) => {
  if (previous.length === 0) return false;
  const device = getDeviceGroup(current.userAgent);
  const network = getNetworkGroup(current.ipAddress);
  return !previous.some(
    (session) =>
      getDeviceGroup(session.userAgent) === device &&
      getNetworkGroup(session.ipAddress) === network,
  );
};

export const notifySignificantNewSession = async (session: SessionSignal) => {
  const [user, previousSessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        email: true,
        emailVerified: true,
        preferences: { select: { locale: true, timezone: true } },
      },
    }),
    prisma.session.findMany({
      where: { userId: session.userId, id: { not: session.id } },
      select: { userAgent: true, ipAddress: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (
    !user?.emailVerified ||
    !isSignificantNewSession(session, previousSessions)
  ) {
    return { sent: false as const, reason: "not_significant" as const };
  }

  const locale = user.preferences?.locale === "en" ? "en" : "fr";
  const occurredAt = new Intl.DateTimeFormat(
    locale === "fr" ? "fr-FR" : "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: getSafeTimeZone(user.preferences?.timezone),
    },
  ).format(session.createdAt);
  const result = await sendEmail({
    to: user.email,
    subject:
      locale === "fr"
        ? "Nouvelle connexion à votre compte Moodday"
        : "New sign-in to your Moodday account",
    html: NewSignInEmail({
      locale,
      device: getApproximateSessionDevice(session.userAgent, locale),
      occurredAt,
      securityUrl: `${getServerUrl()}/settings/security`,
    }),
    tracking: { template: "new-sign-in", userId: session.userId },
  });
  if (result.error) {
    const error = new Error("new_session_alert_delivery_failed");
    error.name = "new_session_alert_delivery_failed";
    throw error;
  }
  return { sent: true as const };
};
