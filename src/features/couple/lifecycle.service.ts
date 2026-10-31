import "server-only";

import DuoFormedEmail, {
  subject as duoFormedSubject,
} from "@email/couple/duo-formed";
import OwnerInviteEmail, {
  subject as ownerInviteSubject,
} from "@email/couple/owner-invite";
import OwnerRhythmEmail, {
  subject as ownerRhythmSubject,
} from "@email/couple/owner-rhythm";
import OwnerWelcomeEmail, {
  subject as ownerWelcomeSubject,
} from "@email/couple/owner-welcome";
import SupporterDayTwoEmail, {
  subject as supporterDayTwoSubject,
} from "@email/couple/supporter-day-two";
import SupporterGraduationEmail, {
  subject as supporterGraduationSubject,
} from "@email/couple/supporter-graduation";
import SupporterInviteEmail, {
  subject as supporterInviteSubject,
} from "@email/couple/supporter-invite";
import SupporterWelcomeEmail, {
  subject as supporterWelcomeSubject,
} from "@email/couple/supporter-welcome";
import { EMAIL_URLS } from "@email/utils/email-constants";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/mail/send-email";
import { prisma } from "@/lib/prisma";
import { getSafeTimeZone } from "@/lib/temporal/civil-date";
import {
  allyLessons,
  localTimeInTimeZone,
  nextAllyLesson,
} from "@moodday/domain";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { ReactElement } from "react";
import { pickLifecycleStep, type LifecycleStep } from "./lifecycle-plan";

const DAY_MS = 86_400_000;
// Only people onboarded recently enter the sequence: existing accounts are
// never blasted when a new step ships.
const SEQUENCE_WINDOW_DAYS = 45;

const signature = (userId: string) =>
  createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`lifecycle-unsubscribe:${userId}`)
    .digest("base64url");

export const createUnsubscribeToken = (userId: string) =>
  `${userId}.${signature(userId)}`;

export const readUnsubscribeToken = (token: string) => {
  const [userId, provided] = token.split(".");
  if (!userId || !provided) return null;
  const expected = Buffer.from(signature(userId));
  const actual = Buffer.from(provided);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    return null;
  return userId;
};

export const unsubscribeFromLifecycleEmails = async (token: string) => {
  const userId = readUnsubscribeToken(token);
  if (!userId) return false;
  await prisma.userPreferences.upsert({
    where: { userId },
    create: { userId, lifecycleEmails: false },
    update: { lifecycleEmails: false },
  });
  return true;
};

const render = (
  step: LifecycleStep,
  props: {
    userName: string;
    partnerName: string | null;
    role: "cycle_owner" | "supporter";
    nextLesson: (typeof allyLessons)[number] | null;
    unsubscribeUrl: string;
  },
): { subject: string; html: ReactElement } => {
  const base = {
    userName: props.userName,
    unsubscribeUrl: props.unsubscribeUrl,
  };
  switch (step) {
    case "owner_welcome":
      return { subject: ownerWelcomeSubject, html: OwnerWelcomeEmail(base) };
    case "owner_invite":
      return { subject: ownerInviteSubject, html: OwnerInviteEmail(base) };
    case "owner_rhythm":
      return { subject: ownerRhythmSubject, html: OwnerRhythmEmail(base) };
    case "supporter_welcome":
      return {
        subject: supporterWelcomeSubject,
        html: SupporterWelcomeEmail({
          ...base,
          lessonSlug: allyLessons[0].slug,
        }),
      };
    case "supporter_day_two": {
      const lesson = props.nextLesson ?? allyLessons[1];
      return {
        subject: supporterDayTwoSubject,
        html: SupporterDayTwoEmail({
          ...base,
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
        }),
      };
    }
    case "supporter_invite":
      return {
        subject: supporterInviteSubject,
        html: SupporterInviteEmail(base),
      };
    case "supporter_graduation":
      return {
        subject: supporterGraduationSubject,
        html: SupporterGraduationEmail(base),
      };
    case "duo_formed":
      return {
        subject: duoFormedSubject,
        html: DuoFormedEmail({
          ...base,
          partnerName: props.partnerName ?? "ton duo",
          role: props.role,
        }),
      };
  }
};

/** Sends at most one onboarding email per person and per run. */
export const runLifecycleEmails = async (now = new Date()) => {
  const since = new Date(now.getTime() - SEQUENCE_WINDOW_DAYS * DAY_MS);
  const profiles = await prisma.profile.findMany({
    where: {
      onboardedAt: { gte: since },
      user: {
        emailVerified: true,
        OR: [{ preferences: null }, { preferences: { lifecycleEmails: true } }],
      },
    },
    take: 500,
    select: {
      userId: true,
      role: true,
      displayName: true,
      onboardedAt: true,
      user: {
        select: {
          email: true,
          name: true,
          preferences: { select: { timezone: true } },
          lifecycleEmails: { select: { step: true } },
          allyProgress: { select: { lessonSlug: true } },
          _count: { select: { checkIns: true } },
        },
      },
    },
  });

  let sent = 0;
  for (const profile of profiles) {
    const userId = profile.userId;
    // eslint-disable-next-line no-await-in-loop -- bounded sequential batch
    const link = await prisma.coupleLink.findFirst({
      where: {
        status: "active",
        OR: [{ ownerId: userId }, { supporterId: userId }],
      },
      include: {
        owner: {
          select: { name: true, profile: { select: { displayName: true } } },
        },
        supporter: {
          select: { name: true, profile: { select: { displayName: true } } },
        },
      },
    });
    const partner = link
      ? link.ownerId === userId
        ? link.supporter
        : link.owner
      : null;
    const completed = profile.user.allyProgress.map((item) => item.lessonSlug);
    const timeZone = getSafeTimeZone(profile.user.preferences?.timezone);
    const step = pickLifecycleStep({
      role: profile.role,
      daysSinceOnboarding: Math.floor(
        (now.getTime() - (profile.onboardedAt ?? now).getTime()) / DAY_MS,
      ),
      hasActiveLink: Boolean(link),
      daysSinceLinked: link?.acceptedAt
        ? Math.floor((now.getTime() - link.acceptedAt.getTime()) / DAY_MS)
        : null,
      checkInCount: profile.user._count.checkIns,
      completedLessons: completed.length,
      totalLessons: allyLessons.length,
      sent: new Set(profile.user.lifecycleEmails.map((item) => item.step)),
      localHour: Number(localTimeInTimeZone(now, timeZone).slice(0, 2)),
    });
    if (!step) continue;

    try {
      // Claim first: a concurrent run can never send the same step twice.
      // eslint-disable-next-line no-await-in-loop -- bounded sequential batch
      await prisma.lifecycleEmail.create({ data: { userId, step } });
    } catch {
      continue;
    }

    const email = render(step, {
      userName:
        profile.displayName ?? (profile.user.name.split(" ")[0] || "toi"),
      partnerName: partner
        ? (partner.profile?.displayName ?? partner.name)
        : null,
      role: profile.role,
      nextLesson: nextAllyLesson(completed),
      unsubscribeUrl: EMAIL_URLS.lifecycleUnsubscribe(
        createUnsubscribeToken(userId),
      ),
    });
    // eslint-disable-next-line no-await-in-loop -- bounded sequential batch
    const result = await sendEmail({
      to: profile.user.email,
      subject: email.subject,
      html: email.html,
      tracking: { template: `lifecycle-${step}`, userId },
    });
    if (result.error) {
      // Release the claim so the next run can retry this step.
      // eslint-disable-next-line no-await-in-loop -- bounded sequential batch
      await prisma.lifecycleEmail.deleteMany({ where: { userId, step } });
      logger.warn("Lifecycle email failed", {
        eventName: "lifecycle_email_failed",
        status: "failed",
        errorCode: step,
      });
      continue;
    }
    sent += 1;
  }

  return { candidates: profiles.length, sent };
};
