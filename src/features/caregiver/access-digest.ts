/* eslint-disable no-await-in-loop -- Each successful delivery must persist its cursor before another recipient is attempted. */
import CaregiverAccessDigestEmail from "@email/caregiver/access-digest";
import { env } from "@/lib/env";
import { sendEmail } from "@/lib/mail/send-email";
import { prisma } from "@/lib/prisma";
import { getServerUrl } from "@/lib/server-url";

export type CaregiverAccessDigestFrequency = "daily" | "weekly";

const DAY_MS = 24 * 60 * 60 * 1000;
const DIGEST_INTERVAL_MS: Record<CaregiverAccessDigestFrequency, number> = {
  daily: DAY_MS,
  weekly: 7 * DAY_MS,
};

export const getCaregiverAccessDigestWindow = (params: {
  frequency: string;
  lastSentAt: Date | null;
  now: Date;
}) => {
  if (params.frequency !== "daily" && params.frequency !== "weekly") {
    return null;
  }

  const intervalMs = DIGEST_INTERVAL_MS[params.frequency];
  if (
    params.lastSentAt &&
    params.now.getTime() - params.lastSentAt.getTime() < intervalMs
  ) {
    return null;
  }

  return {
    frequency: params.frequency,
    since: params.lastSentAt ?? new Date(params.now.getTime() - intervalMs),
  };
};

const getDigestSubject = (locale: string) =>
  locale === "en"
    ? "New access to your Moodday shared space"
    : "Nouveaux accès à votre espace partagé Moodday";

const assertDelivered = (result: Awaited<ReturnType<typeof sendEmail>>) => {
  if (!result.error) return;
  const error = new Error("caregiver_access_digest_delivery_failed");
  error.name = "caregiver_access_digest_delivery_failed";
  throw error;
};

export const sendCaregiverAccessDigests = async (now = new Date()) => {
  const dailyCutoff = new Date(now.getTime() - DIGEST_INTERVAL_MS.daily);
  const weeklyCutoff = new Date(now.getTime() - DIGEST_INTERVAL_MS.weekly);
  const candidates = await prisma.userPreferences.findMany({
    where: {
      caregiverAccessDigestEnabled: true,
      user: {
        emailVerified: true,
        consents: {
          some: {
            purpose: "caregiver_sharing",
            version: env.LEGAL_PRIVACY_VERSION,
            revokedAt: null,
          },
        },
      },
      OR: [
        {
          caregiverAccessDigestFrequency: "daily",
          OR: [
            { lastCaregiverAccessDigestSentAt: null },
            { lastCaregiverAccessDigestSentAt: { lte: dailyCutoff } },
          ],
        },
        {
          caregiverAccessDigestFrequency: "weekly",
          OR: [
            { lastCaregiverAccessDigestSentAt: null },
            { lastCaregiverAccessDigestSentAt: { lte: weeklyCutoff } },
          ],
        },
      ],
    },
    select: {
      userId: true,
      locale: true,
      caregiverAccessDigestFrequency: true,
      lastCaregiverAccessDigestSentAt: true,
      user: { select: { email: true } },
    },
    orderBy: { userId: "asc" },
    take: 100,
  });

  let sent = 0;
  let withoutNewAccess = 0;
  const failures: unknown[] = [];

  for (const candidate of candidates) {
    const window = getCaregiverAccessDigestWindow({
      frequency: candidate.caregiverAccessDigestFrequency,
      lastSentAt: candidate.lastCaregiverAccessDigestSentAt,
      now,
    });
    if (!window) continue;

    try {
      const [accessCount, caregivers] = await Promise.all([
        prisma.caregiverAccessLog.count({
          where: {
            patientId: candidate.userId,
            accessedAt: { gt: window.since, lte: now },
          },
        }),
        prisma.caregiverAccessLog.findMany({
          where: {
            patientId: candidate.userId,
            accessedAt: { gt: window.since, lte: now },
          },
          distinct: ["caregiverId"],
          select: { caregiverId: true },
        }),
      ]);

      if (accessCount === 0) {
        withoutNewAccess += 1;
        continue;
      }

      const locale = candidate.locale === "en" ? "en" : "fr";
      const result = await sendEmail({
        to: candidate.user.email,
        subject: getDigestSubject(locale),
        html: CaregiverAccessDigestEmail({
          locale,
          accessCount,
          caregiverCount: caregivers.length,
          caregiverUrl: `${getServerUrl()}/caregiver`,
        }),
        tracking: {
          template: "caregiver-access-digest",
          userId: candidate.userId,
        },
      });
      assertDelivered(result);

      await prisma.userPreferences.update({
        where: { userId: candidate.userId },
        data: { lastCaregiverAccessDigestSentAt: now },
      });
      sent += 1;
    } catch (error) {
      failures.push(error);
    }
  }

  if (failures.length > 0) {
    const error = new AggregateError(
      failures,
      "caregiver_access_digest_batch_failed",
    );
    error.name = "caregiver_access_digest_batch_failed";
    throw error;
  }

  return {
    examined: candidates.length,
    sent,
    withoutNewAccess,
  };
};
