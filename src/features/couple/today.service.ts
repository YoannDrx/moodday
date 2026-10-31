import "server-only";

import type { TodayDto } from "@moodday/contracts";
import { getAllyProgress } from "./ally.service";
import { getCheckIn, listCustomNeeds, toCheckInDto } from "./check-in.service";
import { getCycleSnapshot } from "./cycle.service";
import { listGestures } from "./gesture.service";
import { getOpenLink, partnerOf } from "./link.service";
import { readPartnerView } from "./partner-view.service";
import { getUserContext } from "./shared";

/** Everything the "Aujourd'hui" screen needs, for either side of the duo. */
export const getToday = async (
  userId: string,
  now = new Date(),
): Promise<TodayDto> => {
  const context = await getUserContext(userId, now);
  const link = await getOpenLink(userId);
  const linkDto = link
    ? {
        status:
          link.status === "active" ? ("active" as const) : ("invited" as const),
        partnerName: partnerOf(link, userId)?.name ?? null,
        level: link.level,
        shareSymptoms: link.shareSymptoms,
        detailedPreviews: link.detailedPreviews,
        pausedUntil:
          link.pausedUntil && link.pausedUntil > now
            ? link.pausedUntil.toISOString()
            : null,
      }
    : null;

  const base = {
    role: context.role,
    onboarded: context.onboarded,
    displayName: context.name,
    localDate: context.today,
    link: linkDto,
    owner: null,
    supporter: null,
  };

  if (context.role === "cycle_owner") {
    const [checkIn, cycle, gestures, customNeeds] = await Promise.all([
      getCheckIn(userId, context.today),
      getCycleSnapshot(userId, context.today),
      listGestures(userId, 10),
      listCustomNeeds(userId),
    ]);
    return {
      ...base,
      owner: {
        checkIn: checkIn ? toCheckInDto(checkIn) : null,
        cycle: {
          phase: cycle.phase,
          phaseTitle: cycle.phaseTitle,
          cycleDay: cycle.cycleDay,
          daysUntilNextPeriod: cycle.daysUntilNextPeriod,
          nextPeriodStart: cycle.nextPeriodStart,
          periodOngoing: cycle.periodOngoing,
          confidence: cycle.confidence,
          pmsInsight: cycle.pmsInsight,
        },
        gestures,
        customNeeds,
      },
    };
  }

  if (context.role === "supporter") {
    const [view, gestures, ally] = await Promise.all([
      link?.status === "active" ? readPartnerView(userId, now) : null,
      listGestures(userId, 10),
      getAllyProgress(userId),
    ]);
    return {
      ...base,
      supporter: {
        partner: view
          ? view.status === "paused"
            ? {
                status: "paused",
                ownerName: view.ownerName,
                pausedUntil: view.pausedUntil,
                phase: null,
                phaseText: null,
                daysUntilNextPeriod: null,
                today: null,
                checkedInPrivately: false,
              }
            : {
                status: "active",
                ownerName: view.ownerName,
                pausedUntil: null,
                phase: view.cycle.phase,
                phaseText: view.cycle.phaseText,
                daysUntilNextPeriod: view.cycle.daysUntilNextPeriod,
                today: view.today,
                checkedInPrivately: view.checkedInPrivately,
              }
          : null,
        gestures,
        nextLesson: ally.next
          ? { slug: ally.next.slug, day: ally.next.day, title: ally.next.title }
          : null,
        completedLessons: ally.completed.length,
      },
    };
  }

  return base;
};
