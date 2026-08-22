import {
  createAppointmentBrief,
  createAppointmentQuestion,
} from "@/features/v2/appointments/artifact-service";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createdAt = new Date("2026-08-22T08:00:00.000Z");

describe("Mood Day V2 appointment artifacts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a question exactly once and keeps private text out of its receipt", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
      id: "appointment-1",
    } as never);
    vi.mocked(prisma.appointmentQuestion.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.appointmentQuestion.aggregate).mockResolvedValue({
      _max: { position: 1 },
    } as never);
    vi.mocked(prisma.appointmentQuestion.create).mockResolvedValue({
      id: "question-private-1",
      appointmentId: "appointment-1",
      operationId: "operation-question-1",
      position: 2,
      content: "Question très privée",
      privateNote: true,
      answeredAt: null,
    } as never);
    vi.mocked(prisma.syncOperation.create).mockResolvedValue({} as never);

    await expect(
      createAppointmentQuestion("user-1", "appointment-1", {
        operationId: "operation-question-1",
        questionId: "question-private-1",
        content: "Question très privée",
        privateNote: true,
      }),
    ).resolves.toMatchObject({
      id: "question-private-1",
      privateNote: true,
      position: 2,
    });

    const receiptData = vi.mocked(prisma.syncOperation.create).mock
      .calls[0]?.[0]?.data;
    expect(receiptData).toMatchObject({
      operationId: "operation-question-1",
      entityType: "appointment_question",
      entityId: "question-private-1",
      status: "applied",
    });
    expect(receiptData).not.toHaveProperty("payload");
    expect(receiptData.payloadDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(receiptData)).not.toContain("Question très privée");
  });

  it("builds a versioned brief from an allowlist and excludes private questions", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.appointmentBrief.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
      title: "Suivi avec la psychiatre",
      startsAt: new Date("2026-08-27T09:00:00.000Z"),
      timezone: "Europe/Paris",
      clinician: { displayName: "Dr Martin" },
      questions: [
        { content: "Comment ajuster mon rythme ?", privateNote: false },
        { content: "Note à garder pour moi", privateNote: true },
      ],
      decisions: [
        {
          summary: "Observer le sommeil pendant une semaine",
          status: "open",
          dueAt: new Date("2026-09-03T09:00:00.000Z"),
        },
      ],
      briefs: [{ version: 2 }],
    } as never);
    vi.mocked(prisma.appointmentBrief.create).mockResolvedValue({
      id: "brief-3",
      appointmentId: "appointment-1",
      operationId: "operation-brief-3",
      version: 3,
      content: {
        appointment: {
          title: "Suivi avec la psychiatre",
          startsAt: "2026-08-27T09:00:00.000Z",
          timezone: "Europe/Paris",
          clinician: "Dr Martin",
        },
        questions: [{ content: "Comment ajuster mon rythme ?" }],
        decisions: [
          {
            summary: "Observer le sommeil pendant une semaine",
            status: "open",
            dueAt: "2026-09-03T09:00:00.000Z",
          },
        ],
        generatedAt: createdAt.toISOString(),
        excludedPrivateQuestionCount: 1,
      },
      privateNotesExcluded: true,
      periodStart: null,
      periodEnd: null,
      createdAt,
    } as never);

    const result = await createAppointmentBrief("user-1", "appointment-1", {
      operationId: "operation-brief-3",
      briefId: "brief-3",
    });

    expect(result).toMatchObject({
      version: 3,
      privateNotesExcluded: true,
      content: {
        questions: [{ content: "Comment ajuster mon rythme ?" }],
        excludedPrivateQuestionCount: 1,
        decisions: [
          {
            summary: "Observer le sommeil pendant une semaine",
            status: "open",
          },
        ],
      },
    });
    expect(JSON.stringify(result)).not.toContain("Note à garder pour moi");
    expect(prisma.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "appointment-1", userId: "user-1" },
        select: expect.not.objectContaining({ note: expect.anything() }),
      }),
    );
  });

  it("replays an existing brief without regenerating its contents", async () => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(prisma),
    );
    vi.mocked(prisma.appointmentBrief.findUnique).mockResolvedValue({
      id: "brief-existing",
      appointmentId: "appointment-1",
      operationId: "operation-brief-existing",
      version: 1,
      content: {
        appointment: {
          title: "Rendez-vous",
          startsAt: "2026-08-27T09:00:00.000Z",
          timezone: "Europe/Paris",
          clinician: null,
        },
        questions: [],
        decisions: [],
        generatedAt: "2026-08-22T08:00:00.000Z",
        excludedPrivateQuestionCount: 0,
      },
      privateNotesExcluded: true,
      periodStart: null,
      periodEnd: null,
      createdAt,
    } as never);

    await expect(
      createAppointmentBrief("user-1", "appointment-1", {
        operationId: "operation-brief-existing",
        briefId: "brief-existing",
      }),
    ).resolves.toMatchObject({ id: "brief-existing", version: 1 });
    expect(prisma.appointment.findFirst).not.toHaveBeenCalled();
    expect(prisma.appointmentBrief.create).not.toHaveBeenCalled();
  });
});
