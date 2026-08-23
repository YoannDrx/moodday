import type {
  AppointmentBriefShareDto,
  AppointmentBriefShareResult,
  CreateAppointmentBriefShareInput,
  SharedAppointmentBriefDto,
} from "@moodday/contracts";
import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  appointmentBriefSelection,
  toAppointmentBriefDto,
} from "./artifact-service";

export class AppointmentBriefShareUnavailableError extends Error {
  constructor() {
    super("Appointment brief share is unavailable");
    this.name = "AppointmentBriefShareUnavailableError";
  }
}

export const digestAppointmentBriefShareToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const appointmentBriefShareSelection = {
  id: true,
  briefId: true,
  expiresAt: true,
  revokedAt: true,
  accessCount: true,
  lastAccessedAt: true,
  createdAt: true,
} as const;

type SelectedShare = Prisma.AppointmentBriefShareGetPayload<{
  select: typeof appointmentBriefShareSelection;
}>;

const toShareDto = (share: SelectedShare): AppointmentBriefShareDto => ({
  ...share,
  expiresAt: share.expiresAt.toISOString(),
  revokedAt: share.revokedAt?.toISOString() ?? null,
  lastAccessedAt: share.lastAccessedAt?.toISOString() ?? null,
  createdAt: share.createdAt.toISOString(),
});

const requireOwnedBrief = async (
  transaction: Prisma.TransactionClient,
  userId: string,
  briefId: string,
) => {
  const brief = await transaction.appointmentBrief.findFirst({
    where: { id: briefId, appointment: { userId } },
    select: { id: true },
  });
  if (!brief) throw new AppointmentBriefShareUnavailableError();
};

export const createAppointmentBriefShare = async (
  userId: string,
  briefId: string,
  input: CreateAppointmentBriefShareInput,
  now = new Date(),
): Promise<AppointmentBriefShareResult> =>
  prisma.$transaction(async (transaction) => {
    await requireOwnedBrief(transaction, userId, briefId);
    const tokenDigest = digestAppointmentBriefShareToken(input.token);
    const existing = await transaction.appointmentBriefShare.findUnique({
      where: {
        briefId_operationId: { briefId, operationId: input.operationId },
      },
      select: { ...appointmentBriefShareSelection, tokenDigest: true },
    });
    if (existing) {
      if (existing.tokenDigest !== tokenDigest) {
        throw new AppointmentBriefShareUnavailableError();
      }
      return { share: toShareDto(existing), token: input.token };
    }

    const share = await transaction.appointmentBriefShare.create({
      data: {
        id: input.shareId,
        briefId,
        operationId: input.operationId,
        tokenDigest,
        expiresAt: new Date(
          now.getTime() + input.expiresInHours * 60 * 60 * 1000,
        ),
      },
      select: appointmentBriefShareSelection,
    });
    return { share: toShareDto(share), token: input.token };
  });

export const listAppointmentBriefShares = async (
  userId: string,
  briefId: string,
) => {
  const brief = await prisma.appointmentBrief.findFirst({
    where: { id: briefId, appointment: { userId } },
    select: {
      shares: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: appointmentBriefShareSelection,
      },
    },
  });
  if (!brief) throw new AppointmentBriefShareUnavailableError();
  return brief.shares.map(toShareDto);
};

export const getOwnedAppointmentBrief = async (
  userId: string,
  briefId: string,
) => {
  const brief = await prisma.appointmentBrief.findFirst({
    where: { id: briefId, appointment: { userId } },
    select: appointmentBriefSelection,
  });
  if (!brief) throw new AppointmentBriefShareUnavailableError();
  return toAppointmentBriefDto(brief);
};

export const revokeAppointmentBriefShare = async (
  userId: string,
  briefId: string,
  shareId: string,
  now = new Date(),
) => {
  const result = await prisma.appointmentBriefShare.updateMany({
    where: {
      id: shareId,
      briefId,
      brief: { appointment: { userId } },
      revokedAt: null,
    },
    data: { revokedAt: now },
  });
  if (result.count === 0) throw new AppointmentBriefShareUnavailableError();
  return { revoked: true } as const;
};

export const resolveAppointmentBriefShare = async (
  token: string,
  now = new Date(),
): Promise<SharedAppointmentBriefDto> =>
  prisma.$transaction(async (transaction) => {
    const share = await transaction.appointmentBriefShare.findUnique({
      where: { tokenDigest: digestAppointmentBriefShareToken(token) },
      select: {
        id: true,
        expiresAt: true,
        revokedAt: true,
        brief: { select: appointmentBriefSelection },
      },
    });
    if (!share || share.revokedAt || share.expiresAt <= now) {
      throw new AppointmentBriefShareUnavailableError();
    }
    await transaction.appointmentBriefShare.update({
      where: { id: share.id },
      data: { accessCount: { increment: 1 }, lastAccessedAt: now },
    });
    return {
      brief: toAppointmentBriefDto(share.brief),
      expiresAt: share.expiresAt.toISOString(),
    };
  });
