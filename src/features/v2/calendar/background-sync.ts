import "server-only";

/* eslint-disable no-await-in-loop -- each connection owns an independent lease */

import { prisma } from "@/lib/prisma";
import { synchronizeGoogleCalendar } from "./sync-service";

const BATCH_SIZE = 20;
const SYNC_INTERVAL_MS = 15 * 60 * 1000;

export const synchronizeDueGoogleCalendars = async (now = new Date()) => {
  const dueBefore = new Date(now.getTime() - SYNC_INTERVAL_MS);
  const connections = await prisma.calendarConnection.findMany({
    where: {
      provider: "google",
      revokedAt: null,
      googleAccountId: { not: null },
      externalCalendarId: { not: null },
      sourceConnection: { is: { status: "active" } },
      OR: [
        { lastSyncCompletedAt: null },
        { lastSyncCompletedAt: { lte: dueBefore } },
      ],
      AND: [
        {
          OR: [{ syncLeaseUntil: null }, { syncLeaseUntil: { lt: now } }],
        },
      ],
    },
    orderBy: [{ lastSyncCompletedAt: "asc" }, { createdAt: "asc" }],
    take: BATCH_SIZE,
    select: { id: true, userId: true },
  });

  let synchronized = 0;
  let failed = 0;
  for (const connection of connections) {
    try {
      await synchronizeGoogleCalendar(connection.userId, connection.id);
      synchronized += 1;
    } catch {
      failed += 1;
    }
  }

  if (failed > 0) {
    const error = new Error("google_calendar_background_sync_failed");
    error.name = "google_calendar_background_sync_failed";
    throw error;
  }

  return {
    examined: connections.length,
    synchronized,
    remaining: connections.length === BATCH_SIZE,
  };
};
