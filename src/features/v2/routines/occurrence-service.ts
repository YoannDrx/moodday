import type {
  CreateRoutineOccurrenceInput,
  RoutineOccurrenceDto,
} from "@moodday/contracts";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPayloadDigest } from "../sync/digest";

export class RoutineOccurrenceUnavailableError extends Error {}
export class RoutineOccurrenceAlreadyExistsError extends Error {}

export const routineOccurrenceSelection = {
  id: true,
  routineId: true,
  operationId: true,
  localDate: true,
  timezone: true,
  status: true,
  completedAt: true,
  note: true,
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedRoutineOccurrence = Prisma.RoutineOccurrenceGetPayload<{
  select: typeof routineOccurrenceSelection;
}>;

export const toRoutineOccurrenceDto = (
  occurrence: SelectedRoutineOccurrence,
): RoutineOccurrenceDto => ({
  ...occurrence,
  completedAt: occurrence.completedAt?.toISOString() ?? null,
  createdAt: occurrence.createdAt.toISOString(),
  updatedAt: occurrence.updatedAt.toISOString(),
});

export const createRoutineOccurrence = async (
  userId: string,
  input: CreateRoutineOccurrenceInput,
): Promise<RoutineOccurrenceDto> => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const receipt = await transaction.syncOperation.findUnique({
        where: {
          userId_operationId: { userId, operationId: input.operationId },
        },
        select: { entityType: true, entityId: true },
      });
      if (receipt && receipt.entityType !== "routine_occurrence") {
        throw new Error(
          "Operation identifier already belongs to another entity",
        );
      }
      if (receipt?.entityId) {
        const replay = await transaction.routineOccurrence.findFirst({
          where: { id: receipt.entityId, routine: { userId } },
          select: routineOccurrenceSelection,
        });
        if (replay) return toRoutineOccurrenceDto(replay);
      }

      const routine = await transaction.routine.findFirst({
        where: { id: input.routineId, userId, status: { not: "archived" } },
        select: { id: true },
      });
      if (!routine) throw new RoutineOccurrenceUnavailableError();

      const dailyOccurrence = await transaction.routineOccurrence.findUnique({
        where: {
          routineId_localDate: {
            routineId: routine.id,
            localDate: input.localDate,
          },
        },
        select: { id: true },
      });
      if (dailyOccurrence) throw new RoutineOccurrenceAlreadyExistsError();

      const occurrence = await transaction.routineOccurrence.create({
        data: {
          id: input.entityId,
          routineId: routine.id,
          operationId: input.operationId,
          localDate: input.localDate,
          timezone: input.timezone,
          status: input.status,
          completedAt: input.completedAt ? new Date(input.completedAt) : null,
          note: input.note ?? null,
        },
        select: routineOccurrenceSelection,
      });
      await transaction.syncOperation.create({
        data: {
          userId,
          operationId: input.operationId,
          entityType: "routine_occurrence",
          entityId: occurrence.id,
          mutation: "create",
          status: "applied",
          payloadDigest: createPayloadDigest(input),
          appliedAt: new Date(),
        },
      });
      return toRoutineOccurrenceDto(occurrence);
    });
  } catch (error) {
    if (
      error instanceof RoutineOccurrenceUnavailableError ||
      error instanceof RoutineOccurrenceAlreadyExistsError
    ) {
      throw error;
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new RoutineOccurrenceAlreadyExistsError();
    }
    throw error;
  }
};

export const listRoutineOccurrences = async ({
  userId,
  localDate,
}: {
  userId: string;
  localDate: string;
}): Promise<RoutineOccurrenceDto[]> => {
  const occurrences = await prisma.routineOccurrence.findMany({
    where: { localDate, routine: { userId } },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: routineOccurrenceSelection,
  });
  return occurrences.map(toRoutineOccurrenceDto);
};
