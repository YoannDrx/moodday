import type {
  AppointmentBriefContent,
  AppointmentBriefDto,
  AppointmentDecisionDto,
  AppointmentEventDto,
  AppointmentQuestionDto,
  CreateAppointmentBriefInput,
  CreateAppointmentDecisionInput,
  CreateAppointmentEventInput,
  CreateAppointmentQuestionInput,
} from "@moodday/contracts";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createPayloadDigest } from "../sync/digest";

export class AppointmentArtifactUnavailableError extends Error {
  constructor() {
    super("Appointment artifact is unavailable");
    this.name = "AppointmentArtifactUnavailableError";
  }
}

export const appointmentQuestionSelection = {
  id: true,
  appointmentId: true,
  operationId: true,
  position: true,
  content: true,
  privateNote: true,
  answeredAt: true,
} as const;

export const appointmentEventSelection = {
  id: true,
  appointmentId: true,
  operationId: true,
  type: true,
  occurredAt: true,
  payload: true,
  createdAt: true,
} as const;

export const appointmentDecisionSelection = {
  id: true,
  appointmentId: true,
  operationId: true,
  summary: true,
  status: true,
  includeInBrief: true,
  dueAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const appointmentBriefSelection = {
  id: true,
  appointmentId: true,
  operationId: true,
  version: true,
  content: true,
  privateNotesExcluded: true,
  periodStart: true,
  periodEnd: true,
  createdAt: true,
} as const;

type SelectedQuestion = Prisma.AppointmentQuestionGetPayload<{
  select: typeof appointmentQuestionSelection;
}>;
type SelectedEvent = Prisma.AppointmentEventGetPayload<{
  select: typeof appointmentEventSelection;
}>;
type SelectedDecision = Prisma.AppointmentDecisionGetPayload<{
  select: typeof appointmentDecisionSelection;
}>;
type SelectedBrief = Prisma.AppointmentBriefGetPayload<{
  select: typeof appointmentBriefSelection;
}>;

export const toAppointmentQuestionDto = (
  question: SelectedQuestion,
): AppointmentQuestionDto => ({
  ...question,
  answeredAt: question.answeredAt?.toISOString() ?? null,
});

export const toAppointmentEventDto = (
  event: SelectedEvent,
): AppointmentEventDto => ({
  ...event,
  payload: event.payload as { summary?: string } | null,
  occurredAt: event.occurredAt.toISOString(),
  createdAt: event.createdAt.toISOString(),
});

export const toAppointmentDecisionDto = (
  decision: SelectedDecision,
): AppointmentDecisionDto => ({
  ...decision,
  dueAt: decision.dueAt?.toISOString() ?? null,
  completedAt: decision.completedAt?.toISOString() ?? null,
  createdAt: decision.createdAt.toISOString(),
  updatedAt: decision.updatedAt.toISOString(),
});

export const toAppointmentBriefDto = (
  brief: SelectedBrief,
): AppointmentBriefDto => ({
  ...brief,
  content: brief.content as AppointmentBriefContent,
  privateNotesExcluded: true,
  periodStart: brief.periodStart?.toISOString() ?? null,
  periodEnd: brief.periodEnd?.toISOString() ?? null,
  createdAt: brief.createdAt.toISOString(),
});

const requireOwnedAppointment = async (
  transaction: Prisma.TransactionClient,
  userId: string,
  appointmentId: string,
) => {
  const appointment = await transaction.appointment.findFirst({
    where: { id: appointmentId, userId },
    select: { id: true },
  });
  if (!appointment) throw new AppointmentArtifactUnavailableError();
};

const createArtifactReceipt = async ({
  transaction,
  userId,
  operationId,
  entityType,
  entityId,
  payload,
}: {
  transaction: Prisma.TransactionClient;
  userId: string;
  operationId: string;
  entityType:
    | "appointment_question"
    | "appointment_event"
    | "appointment_decision";
  entityId: string;
  payload: unknown;
}) =>
  transaction.syncOperation.create({
    data: {
      userId,
      operationId,
      entityType,
      entityId,
      mutation: "create",
      status: "applied",
      payloadDigest: createPayloadDigest(payload),
      appliedAt: new Date(),
    },
  });

export const createAppointmentQuestion = async (
  userId: string,
  appointmentId: string,
  input: CreateAppointmentQuestionInput,
) =>
  prisma.$transaction(async (transaction) => {
    await requireOwnedAppointment(transaction, userId, appointmentId);
    const existing = await transaction.appointmentQuestion.findUnique({
      where: {
        appointmentId_operationId: {
          appointmentId,
          operationId: input.operationId,
        },
      },
      select: appointmentQuestionSelection,
    });
    if (existing) return toAppointmentQuestionDto(existing);
    const lastPosition =
      input.position !== undefined
        ? null
        : await transaction.appointmentQuestion.aggregate({
            where: { appointmentId },
            _max: { position: true },
          });
    const question = await transaction.appointmentQuestion.create({
      data: {
        id: input.questionId,
        appointmentId,
        operationId: input.operationId,
        position: input.position ?? (lastPosition?._max.position ?? -1) + 1,
        content: input.content,
        privateNote: input.privateNote,
      },
      select: appointmentQuestionSelection,
    });
    await createArtifactReceipt({
      transaction,
      userId,
      operationId: input.operationId,
      entityType: "appointment_question",
      entityId: question.id,
      payload: input,
    });
    return toAppointmentQuestionDto(question);
  });

export const createAppointmentEvent = async (
  userId: string,
  appointmentId: string,
  input: CreateAppointmentEventInput,
) =>
  prisma.$transaction(async (transaction) => {
    await requireOwnedAppointment(transaction, userId, appointmentId);
    const existing = await transaction.appointmentEvent.findUnique({
      where: {
        appointmentId_operationId: {
          appointmentId,
          operationId: input.operationId,
        },
      },
      select: appointmentEventSelection,
    });
    if (existing) return toAppointmentEventDto(existing);
    const event = await transaction.appointmentEvent.create({
      data: {
        id: input.eventId,
        appointmentId,
        operationId: input.operationId,
        type: input.type,
        occurredAt: new Date(input.occurredAt),
        payload: (input.payload ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
      },
      select: appointmentEventSelection,
    });
    await createArtifactReceipt({
      transaction,
      userId,
      operationId: input.operationId,
      entityType: "appointment_event",
      entityId: event.id,
      payload: input,
    });
    return toAppointmentEventDto(event);
  });

export const createAppointmentDecision = async (
  userId: string,
  appointmentId: string,
  input: CreateAppointmentDecisionInput,
) =>
  prisma.$transaction(async (transaction) => {
    await requireOwnedAppointment(transaction, userId, appointmentId);
    const existing = await transaction.appointmentDecision.findUnique({
      where: {
        appointmentId_operationId: {
          appointmentId,
          operationId: input.operationId,
        },
      },
      select: appointmentDecisionSelection,
    });
    if (existing) return toAppointmentDecisionDto(existing);
    const decision = await transaction.appointmentDecision.create({
      data: {
        id: input.decisionId,
        appointmentId,
        operationId: input.operationId,
        summary: input.summary,
        status: input.status,
        includeInBrief: input.includeInBrief,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
        completedAt: input.status === "completed" ? new Date() : null,
      },
      select: appointmentDecisionSelection,
    });
    await createArtifactReceipt({
      transaction,
      userId,
      operationId: input.operationId,
      entityType: "appointment_decision",
      entityId: decision.id,
      payload: input,
    });
    return toAppointmentDecisionDto(decision);
  });

export const createAppointmentBrief = async (
  userId: string,
  appointmentId: string,
  input: CreateAppointmentBriefInput,
) =>
  prisma.$transaction(async (transaction) => {
    const existing = await transaction.appointmentBrief.findUnique({
      where: {
        appointmentId_operationId: {
          appointmentId,
          operationId: input.operationId,
        },
      },
      select: appointmentBriefSelection,
    });
    if (existing) return toAppointmentBriefDto(existing);

    const appointment = await transaction.appointment.findFirst({
      where: { id: appointmentId, userId },
      select: {
        title: true,
        startsAt: true,
        timezone: true,
        clinician: { select: { displayName: true } },
        questions: {
          orderBy: { position: "asc" },
          select: { content: true, privateNote: true },
        },
        decisions: {
          where: { includeInBrief: true, status: { not: "dismissed" } },
          orderBy: { createdAt: "asc" },
          select: { summary: true, status: true, dueAt: true },
        },
        briefs: {
          select: { version: true },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });
    if (!appointment) throw new AppointmentArtifactUnavailableError();
    const generatedAt = new Date();
    const content: AppointmentBriefContent = {
      appointment: {
        title: appointment.title,
        startsAt: appointment.startsAt.toISOString(),
        timezone: appointment.timezone,
        clinician: appointment.clinician?.displayName ?? null,
      },
      questions: appointment.questions
        .filter((question) => !question.privateNote)
        .map((question) => ({ content: question.content })),
      decisions: appointment.decisions.map((decision) => ({
        summary: decision.summary,
        status: decision.status,
        dueAt: decision.dueAt?.toISOString() ?? null,
      })),
      generatedAt: generatedAt.toISOString(),
      excludedPrivateQuestionCount: appointment.questions.filter(
        (question) => question.privateNote,
      ).length,
    };
    const brief = await transaction.appointmentBrief.create({
      data: {
        id: input.briefId,
        appointmentId,
        operationId: input.operationId,
        version: (appointment.briefs[0]?.version ?? 0) + 1,
        content: content as unknown as Prisma.InputJsonValue,
        privateNotesExcluded: true,
        periodStart: input.periodStart ? new Date(input.periodStart) : null,
        periodEnd: input.periodEnd ? new Date(input.periodEnd) : null,
      },
      select: appointmentBriefSelection,
    });
    return toAppointmentBriefDto(brief);
  });

export const listAppointmentArtifacts = async (
  userId: string,
  appointmentId: string,
) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId },
    select: {
      questions: {
        orderBy: { position: "asc" },
        select: appointmentQuestionSelection,
      },
      events: {
        orderBy: { occurredAt: "asc" },
        select: appointmentEventSelection,
      },
      decisions: {
        orderBy: { createdAt: "asc" },
        select: appointmentDecisionSelection,
      },
      briefs: {
        orderBy: { version: "desc" },
        take: 10,
        select: appointmentBriefSelection,
      },
    },
  });
  if (!appointment) throw new AppointmentArtifactUnavailableError();
  return {
    questions: appointment.questions.map(toAppointmentQuestionDto),
    events: appointment.events.map(toAppointmentEventDto),
    decisions: appointment.decisions.map(toAppointmentDecisionDto),
    briefs: appointment.briefs.map(toAppointmentBriefDto),
  };
};
