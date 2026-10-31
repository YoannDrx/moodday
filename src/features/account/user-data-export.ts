/* eslint-disable no-await-in-loop */
import type { Prisma } from "@prisma/client";
import { createJsonDownloadStream } from "./json-download";
import { prisma } from "@/lib/prisma";

type Page = {
  take: number;
  skip?: number;
  cursor?: { id: string };
  orderBy: { id: "asc" };
};
type Collection = <T extends { id: string }>(
  read: (page?: Page) => Promise<T[]>,
) => Promise<T[] | AsyncIterable<T>>;
const eagerCollection: Collection = async (read) => read();
const paginatedCollection: Collection = async (read) => ({
  async *[Symbol.asyncIterator]() {
    let cursor: string | undefined;
    for (;;) {
      const rows = await read({
        take: 250,
        orderBy: { id: "asc" },
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      for (const row of rows) yield row;
      if (rows.length < 250) break;
      cursor = rows.at(-1)?.id;
    }
  },
});

const readUserDataExport = async (
  tx: Prisma.TransactionClient,
  user: { id: string },
  collection: Collection,
) => {
  const linkWhere = { OR: [{ ownerId: user.id }, { supporterId: user.id }] };
  const [
    userProfile,
    preferences,
    profile,
    consents,
    safetyPlan,
    periods,
    checkIns,
    customNeeds,
    coupleLinks,
    gestures,
    allyProgress,
    accessLog,
  ] = await Promise.all([
    tx.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    tx.userPreferences.findUnique({
      where: { userId: user.id },
      select: {
        hasCompletedOnboarding: true,
        timezone: true,
        theme: true,
        locale: true,
        reducedMotion: true,
        notificationContentMode: true,
        notificationsEnabled: true,
        dailyCheckInReminder: true,
        dailyCheckInTime: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    tx.profile.findUnique({
      where: { userId: user.id },
      select: {
        role: true,
        displayName: true,
        typicalCycleLength: true,
        typicalPeriodLength: true,
        hardestThings: true,
        usualNeeds: true,
        supporterFocus: true,
        onboardedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    tx.userConsent.findMany({
      where: { userId: user.id },
      orderBy: { acceptedAt: "asc" },
      select: {
        purpose: true,
        version: true,
        locale: true,
        country: true,
        source: true,
        acceptedAt: true,
        revokedAt: true,
      },
    }),
    tx.safetyPlan.findUnique({
      where: { userId: user.id },
      select: {
        warningSigns: true,
        copingStrategies: true,
        safePlaces: true,
        trustedContacts: true,
        professionalContacts: true,
        lastReviewedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    collection(async (page) =>
      tx.period.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { startDate: "asc" },
        ...page,
      }),
    ),
    collection(async (page) =>
      tx.dailyCheckIn.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          localDate: true,
          timezone: true,
          state: true,
          symptoms: true,
          needs: true,
          privateNote: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { localDate: "asc" },
        ...page,
      }),
    ),
    tx.customNeed.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, label: true, active: true, createdAt: true },
    }),
    tx.coupleLink.findMany({
      where: linkWhere,
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        ownerId: true,
        supporterId: true,
        invitedByRole: true,
        status: true,
        level: true,
        shareSymptoms: true,
        detailedPreviews: true,
        sharingVersion: true,
        pausedUntil: true,
        acceptedAt: true,
        endedAt: true,
        createdAt: true,
      },
    }),
    collection(async (page) =>
      tx.gesture.findMany({
        where: { OR: [{ senderId: user.id }, { recipientId: user.id }] },
        select: {
          id: true,
          linkId: true,
          senderId: true,
          recipientId: true,
          kind: true,
          message: true,
          status: true,
          seenAt: true,
          thankedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
        ...page,
      }),
    ),
    tx.allyProgress.findMany({
      where: { userId: user.id },
      orderBy: { completedAt: "asc" },
      select: { lessonSlug: true, completedAt: true },
    }),
    collection(async (page) =>
      tx.accessLog.findMany({
        where: { OR: [{ ownerId: user.id }, { actorId: user.id }] },
        select: {
          id: true,
          ownerId: true,
          actorId: true,
          linkId: true,
          action: true,
          resourceKind: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
        ...page,
      }),
    ),
  ]);

  return {
    exportMetadata: {
      exportDate: new Date().toISOString(),
      dataVersion: "3.0",
      applicationName: "Moodday",
      userId: user.id,
      timezone: preferences?.timezone ?? null,
      excludedSecurityData: [
        "authentication sessions and credentials",
        "push subscription secrets and device push tokens",
        "Stripe identifiers",
        "couple invitation codes",
        "offline operation identifiers",
      ],
    },
    user: userProfile,
    preferences,
    profile,
    consents,
    safetyPlan,
    cycle: { periods },
    checkIns,
    customNeeds,
    couple: { links: coupleLinks, gestures, accessLog },
    allyProgress,
  };
};

export const buildUserDataExport = async (user: { id: string }) =>
  prisma.$transaction(
    async (tx) => readUserDataExport(tx, user, eagerCollection),
    { isolationLevel: "RepeatableRead", timeout: 30_000 },
  );

/** The snapshot stays open until the paginated body is consumed or cancelled. */
export const createUserDataExportStream = (user: { id: string }) => {
  const transport = new TransformStream<Uint8Array, Uint8Array>();
  const writer = transport.writable.getWriter();
  void prisma
    .$transaction(
      async (tx) => {
        const data = await readUserDataExport(tx, user, paginatedCollection);
        const reader = createJsonDownloadStream(data).getReader();
        try {
          for (;;) {
            const part = await reader.read();
            if (part.done) break;
            await writer.write(part.value);
          }
        } finally {
          await reader.cancel();
        }
      },
      { isolationLevel: "RepeatableRead", timeout: 90_000 },
    )
    .then(async () => writer.close())
    .catch(async (error: unknown) => writer.abort(error));
  return transport.readable;
};
