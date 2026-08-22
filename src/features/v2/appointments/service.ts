import type {
  AppointmentDto,
  CreateAppointmentInput,
} from "@moodday/contracts";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPayloadDigest } from "../sync/digest";

export const appointmentSelection = {
  id: true,
  clinicianId: true,
  title: true,
  startsAt: true,
  endsAt: true,
  timezone: true,
  location: true,
  status: true,
  source: true,
  externalEventId: true,
  externalVersion: true,
  preparationStatus: true,
  questions: {
    orderBy: { position: "asc" as const },
    select: {
      id: true,
      appointmentId: true,
      operationId: true,
      position: true,
      content: true,
      privateNote: true,
      answeredAt: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} as const;

type SelectedAppointment = Prisma.AppointmentGetPayload<{
  select: typeof appointmentSelection;
}>;

export const toAppointmentDto = (
  appointment: SelectedAppointment,
): AppointmentDto => ({
  ...appointment,
  startsAt: appointment.startsAt.toISOString(),
  endsAt: appointment.endsAt?.toISOString() ?? null,
  questions: appointment.questions.map((question) => ({
    ...question,
    answeredAt: question.answeredAt?.toISOString() ?? null,
  })),
  createdAt: appointment.createdAt.toISOString(),
  updatedAt: appointment.updatedAt.toISOString(),
});

export const createAppointment = async (
  userId: string,
  input: CreateAppointmentInput,
): Promise<AppointmentDto> =>
  prisma.$transaction(async (transaction) => {
    const receipt = await transaction.syncOperation.findUnique({
      where: { userId_operationId: { userId, operationId: input.operationId } },
      select: { entityType: true, entityId: true },
    });
    if (receipt && receipt.entityType !== "appointment") {
      throw new Error("Operation identifier already belongs to another entity");
    }
    if (receipt?.entityId) {
      const existing = await transaction.appointment.findFirst({
        where: { id: receipt.entityId, userId },
        select: appointmentSelection,
      });
      if (existing) return toAppointmentDto(existing);
    }

    const appointment = await transaction.appointment.create({
      data: {
        id: input.entityId,
        userId,
        clinicianId: input.clinicianId ?? null,
        operationId: input.operationId,
        title: input.title,
        startsAt: new Date(input.startsAt),
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        timezone: input.timezone,
        location: input.location ?? null,
        status: input.status,
        source: input.source,
        preparationStatus: input.preparationStatus,
      },
      select: appointmentSelection,
    });
    await transaction.syncOperation.create({
      data: {
        userId,
        operationId: input.operationId,
        entityType: "appointment",
        entityId: appointment.id,
        mutation: "create",
        status: "applied",
        payloadDigest: createPayloadDigest(input),
        appliedAt: new Date(),
      },
    });
    return toAppointmentDto(appointment);
  });

export const listAppointments = async ({
  userId,
  cursor,
  limit = 30,
}: {
  userId: string;
  cursor?: string;
  limit?: number;
}) => {
  const rows = await prisma.appointment.findMany({
    where: { userId },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: appointmentSelection,
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    items: page.map(toAppointmentDto),
    nextCursor: hasMore ? (page.at(-1)?.id ?? null) : null,
  };
};
