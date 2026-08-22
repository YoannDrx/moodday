import type { CheckInDto, CreateCheckInInput } from "@moodday/contracts";
import { prisma } from "@/lib/prisma";
import { createPayloadDigest } from "../sync/digest";

export const checkInSelection = {
  id: true,
  operationId: true,
  depth: true,
  localDate: true,
  timezone: true,
  valence: true,
  activation: true,
  irritability: true,
  anxiety: true,
  contexts: true,
  note: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedCheckIn = {
  id: string;
  operationId: string;
  depth: "presence" | "quick" | "complete";
  localDate: string;
  timezone: string;
  valence: number | null;
  activation: number | null;
  irritability: number | null;
  anxiety: number | null;
  contexts: string[];
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const toCheckInDto = (checkIn: SelectedCheckIn): CheckInDto => ({
  ...checkIn,
  createdAt: checkIn.createdAt.toISOString(),
  updatedAt: checkIn.updatedAt.toISOString(),
});

export const createCheckIn = async (
  userId: string,
  input: CreateCheckInInput,
): Promise<CheckInDto> => {
  return prisma.$transaction(async (transaction) => {
    const existingReceipt = await transaction.syncOperation.findUnique({
      where: { userId_operationId: { userId, operationId: input.operationId } },
      select: { entityType: true },
    });
    if (existingReceipt && existingReceipt.entityType !== "check_in") {
      throw new Error("Operation identifier already belongs to another entity");
    }

    const checkIn = await transaction.checkIn.upsert({
      where: {
        userId_operationId: { userId, operationId: input.operationId },
      },
      update: {},
      create: {
        userId,
        operationId: input.operationId,
        depth: input.depth,
        localDate: input.localDate,
        timezone: input.timezone,
        valence: input.valence ?? null,
        activation: input.activation ?? null,
        irritability: input.irritability ?? null,
        anxiety: input.anxiety ?? null,
        contexts: input.contexts,
        note: input.note ?? null,
      },
      select: checkInSelection,
    });

    if (!existingReceipt) {
      await transaction.syncOperation.create({
        data: {
          userId,
          operationId: input.operationId,
          entityType: "check_in",
          entityId: checkIn.id,
          mutation: "create",
          status: "applied",
          payloadDigest: createPayloadDigest(input),
          appliedAt: new Date(),
        },
      });
    }

    return toCheckInDto(checkIn);
  });
};

export const listCheckIns = async ({
  userId,
  cursor,
  limit = 20,
}: {
  userId: string;
  cursor?: string;
  limit?: number;
}) => {
  const rows = await prisma.checkIn.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: checkInSelection,
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  return {
    items: page.map(toCheckInDto),
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
  };
};
