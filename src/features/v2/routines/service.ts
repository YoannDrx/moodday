import type { CreateRoutineInput, RoutineDto } from "@moodday/contracts";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPayloadDigest } from "../sync/digest";

export const routineSelection = {
  id: true,
  title: true,
  description: true,
  schedule: true,
  weeklyTarget: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedRoutine = Prisma.RoutineGetPayload<{
  select: typeof routineSelection;
}>;

export const toRoutineDto = (routine: SelectedRoutine): RoutineDto => ({
  ...routine,
  schedule: routine.schedule as Record<string, unknown> | null,
  createdAt: routine.createdAt.toISOString(),
  updatedAt: routine.updatedAt.toISOString(),
});

export const createRoutine = async (
  userId: string,
  input: CreateRoutineInput,
): Promise<RoutineDto> =>
  prisma.$transaction(async (transaction) => {
    const receipt = await transaction.syncOperation.findUnique({
      where: { userId_operationId: { userId, operationId: input.operationId } },
      select: { entityType: true, entityId: true },
    });
    if (receipt && receipt.entityType !== "routine") {
      throw new Error("Operation identifier already belongs to another entity");
    }

    if (receipt?.entityId) {
      const existing = await transaction.routine.findFirst({
        where: { id: receipt.entityId, userId },
        select: routineSelection,
      });
      if (existing) return toRoutineDto(existing);
    }

    const routine = await transaction.routine.create({
      data: {
        id: input.entityId,
        userId,
        title: input.title,
        description: input.description ?? null,
        schedule: (input.schedule ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        weeklyTarget: input.weeklyTarget ?? null,
        status: input.status,
      },
      select: routineSelection,
    });
    await transaction.syncOperation.create({
      data: {
        userId,
        operationId: input.operationId,
        entityType: "routine",
        entityId: routine.id,
        mutation: "create",
        status: "applied",
        payloadDigest: createPayloadDigest(input),
        appliedAt: new Date(),
      },
    });
    return toRoutineDto(routine);
  });

export const listRoutines = async ({
  userId,
  cursor,
  limit = 30,
}: {
  userId: string;
  cursor?: string;
  limit?: number;
}) => {
  const rows = await prisma.routine.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: routineSelection,
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    items: page.map(toRoutineDto),
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
  };
};
