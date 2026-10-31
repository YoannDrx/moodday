import "server-only";

import { prisma } from "@/lib/prisma";
import type { CheckInDto, SaveCheckInInput } from "@moodday/contracts";
import {
  addDays,
  isCustomNeedKey,
  needCatalog,
  symptomCatalog,
  type CivilDate,
} from "@moodday/domain";
import { CoupleError, fromCivil, isUniqueViolation, toCivil } from "./shared";

const knownSymptoms = new Set<string>(symptomCatalog.map((item) => item.key));
const knownNeeds = new Set<string>(needCatalog.map((need) => need.key));

export const toCheckInDto = (checkIn: {
  id: string;
  localDate: Date;
  state: CheckInDto["state"];
  symptoms: string[];
  needs: string[];
  privateNote: string | null;
  updatedAt: Date;
}): CheckInDto => ({
  id: checkIn.id,
  localDate: toCivil(checkIn.localDate),
  state: checkIn.state,
  symptoms: checkIn.symptoms,
  needs: checkIn.needs,
  privateNote: checkIn.privateNote,
  updatedAt: checkIn.updatedAt.toISOString(),
});

/**
 * Saves "Mon point" for a civil day. A replay of the same operation returns
 * the stored check-in; a second save on the same day updates it.
 */
export const saveCheckIn = async (
  userId: string,
  input: SaveCheckInInput,
  today: CivilDate,
) => {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { role: true },
  });
  if (profile?.role !== "cycle_owner") {
    throw new CoupleError(
      "cycle_owner_only",
      "Le point du jour se fait depuis l'espace de la personne concernée.",
    );
  }
  // Offline saves may arrive late, but never from the future or too far back.
  if (
    input.localDate > addDays(today, 1) ||
    input.localDate < addDays(today, -7)
  ) {
    throw new CoupleError(
      "date_out_of_range",
      "Ce jour ne peut plus être modifié.",
    );
  }

  const customIds = input.needs
    .filter(isCustomNeedKey)
    .map((key) => key.slice("custom:".length));
  const ownedCustomIds = customIds.length
    ? new Set(
        (
          await prisma.customNeed.findMany({
            where: { userId, id: { in: customIds } },
            select: { id: true },
          })
        ).map((need) => need.id),
      )
    : new Set<string>();

  const data = {
    state: input.state,
    symptoms: [...new Set(input.symptoms)].filter((key) =>
      knownSymptoms.has(key),
    ),
    needs: [...new Set(input.needs)].filter((key) =>
      isCustomNeedKey(key)
        ? ownedCustomIds.has(key.slice("custom:".length))
        : knownNeeds.has(key),
    ),
    privateNote: input.privateNote?.trim() ? input.privateNote.trim() : null,
    timezone: input.timezone,
  };

  const replay = await prisma.dailyCheckIn.findUnique({
    where: { userId_operationId: { userId, operationId: input.operationId } },
  });
  if (replay) return { checkIn: replay, created: false };

  const existing = await prisma.dailyCheckIn.findUnique({
    where: {
      userId_localDate: { userId, localDate: fromCivil(input.localDate) },
    },
  });

  try {
    if (existing) {
      const checkIn = await prisma.dailyCheckIn.update({
        where: { id: existing.id },
        data: { ...data, operationId: input.operationId },
      });
      return { checkIn, created: false };
    }
    const checkIn = await prisma.dailyCheckIn.create({
      data: {
        ...data,
        userId,
        operationId: input.operationId,
        localDate: fromCivil(input.localDate),
      },
    });
    return { checkIn, created: true };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    // Two devices raced on the same day: keep the stored one, apply ours.
    const checkIn = await prisma.dailyCheckIn.update({
      where: {
        userId_localDate: { userId, localDate: fromCivil(input.localDate) },
      },
      data,
    });
    return { checkIn, created: false };
  }
};

export const getCheckIn = async (userId: string, localDate: CivilDate) =>
  prisma.dailyCheckIn.findUnique({
    where: { userId_localDate: { userId, localDate: fromCivil(localDate) } },
  });

export const listCheckIns = async (
  userId: string,
  from: CivilDate,
  to: CivilDate,
) =>
  prisma.dailyCheckIn.findMany({
    where: { userId, localDate: { gte: fromCivil(from), lte: fromCivil(to) } },
    orderBy: { localDate: "desc" },
  });

export const listCustomNeeds = async (userId: string) =>
  prisma.customNeed.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, label: true },
  });

export const addCustomNeed = async (userId: string, label: string) => {
  const count = await prisma.customNeed.count({
    where: { userId, active: true },
  });
  if (count >= 8) {
    throw new CoupleError(
      "too_many_needs",
      "Huit besoins perso, c'est déjà pas mal.",
    );
  }
  return prisma.customNeed.create({ data: { userId, label } });
};

export const archiveCustomNeed = async (userId: string, id: string) =>
  prisma.customNeed.updateMany({
    where: { id, userId },
    data: { active: false },
  });
