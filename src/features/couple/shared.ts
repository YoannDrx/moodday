import "server-only";

import { ApplicationError } from "@/lib/errors/application-error";
import { prisma } from "@/lib/prisma";
import { getSafeTimeZone } from "@/lib/temporal/civil-date";
import { civilDateInTimeZone, type CivilDate } from "@moodday/domain";
import type { Prisma } from "@prisma/client";

/** Business rule violation with a stable code and a French message. */
export class CoupleError extends ApplicationError {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "CoupleError";
    this.code = code;
  }
}

export const toCivil = (date: Date): CivilDate =>
  date.toISOString().slice(0, 10);
export const fromCivil = (date: CivilDate) => new Date(`${date}T00:00:00.000Z`);

export const isUniqueViolation = (error: unknown) =>
  (error as { code?: string } | null)?.code === "P2002";

export type UserContext = {
  userId: string;
  name: string;
  role: "cycle_owner" | "supporter" | null;
  onboarded: boolean;
  timeZone: string;
  today: CivilDate;
};

export const getUserContext = async (
  userId: string,
  now = new Date(),
): Promise<UserContext> => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      name: true,
      profile: { select: { role: true, displayName: true, onboardedAt: true } },
      preferences: { select: { timezone: true } },
    },
  });
  const timeZone = getSafeTimeZone(user.preferences?.timezone);
  return {
    userId,
    name: user.profile?.displayName ?? (user.name.split(" ")[0] || "Toi"),
    role: user.profile?.role ?? null,
    onboarded: Boolean(user.profile?.onboardedAt),
    timeZone,
    today: civilDateInTimeZone(now, timeZone),
  };
};

/**
 * Serialises couple-link mutations per account so that "one open link per
 * person" holds even under concurrent invitations and acceptances.
 */
export const lockAccounts = async (
  tx: Prisma.TransactionClient,
  ...userIds: string[]
) => {
  for (const userId of [...new Set(userIds)].sort()) {
    // eslint-disable-next-line no-await-in-loop -- locks must be taken in order
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`couple:${userId}`}, 0))`;
  }
};
