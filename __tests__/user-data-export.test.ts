import { buildUserDataExport } from "@/features/account/user-data-export";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("buildUserDataExport", () => {
  beforeEach(() => {
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      typeof callback === "function" ? callback(prisma) : Promise.all(callback),
    );
    vi.mocked(prisma.caregiverRelationship.findMany).mockReset();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "user@example.test",
    } as never);
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
      timezone: "Europe/Paris",
    } as never);
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([]);
    vi.mocked(prisma.medication.findMany).mockResolvedValue([]);
    vi.mocked(prisma.therapySession.findMany).mockResolvedValue([]);
    vi.mocked(prisma.exercise.findMany).mockResolvedValue([]);
    vi.mocked(prisma.caregiverObservation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.caregiverEvent.findMany).mockResolvedValue([]);
    vi.mocked(prisma.caregiverAccessLog.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userConsent.findMany).mockResolvedValue([]);
    vi.mocked(prisma.moodTagDefinition.findMany).mockResolvedValue([]);
    vi.mocked(prisma.consultationPreparation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([]);
    vi.mocked(prisma.calendarConnection.findMany).mockResolvedValue([]);
    vi.mocked(prisma.checkIn.findMany).mockResolvedValue([]);
    vi.mocked(prisma.observation.findMany).mockResolvedValue([]);
    vi.mocked(prisma.dailyAggregate.findMany).mockResolvedValue([]);
    vi.mocked(prisma.sourceConnection.findMany).mockResolvedValue([]);
    vi.mocked(prisma.routine.findMany).mockResolvedValue([]);
    vi.mocked(prisma.userDraft.findMany).mockResolvedValue([]);
    vi.mocked(prisma.circleRelationship.findMany).mockResolvedValue([]);
    vi.mocked(prisma.supportRequest.findMany).mockResolvedValue([]);
    vi.mocked(prisma.caregiverContribution.findMany).mockResolvedValue([]);
    vi.mocked(prisma.accessLog.findMany).mockResolvedValue([]);
    vi.mocked(prisma.safetyPlan.findUnique).mockResolvedValue(null);
  });

  it("exports patient-visible content and only currently accessible caregiver data", async () => {
    vi.mocked(prisma.caregiverRelationship.findMany)
      .mockResolvedValueOnce([
        { id: "active-relationship", patientId: "patient-2" },
      ] as never)
      .mockResolvedValueOnce([{ id: "active-relationship" }] as never);

    const result = await buildUserDataExport({ id: "user-1" });

    expect(result.exportMetadata).toEqual(
      expect.objectContaining({
        dataVersion: "2.5",
        applicationName: "Moodday",
        userId: "user-1",
        timezone: "Europe/Paris",
      }),
    );
    expect(result.exportMetadata.excludedSecurityData).toContain(
      "authentication sessions and credentials",
    );
    expect(prisma.caregiverObservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { subjectId: "user-1", visibleToPatient: true },
            { observerId: "user-1", subjectId: { in: ["patient-2"] } },
          ],
        },
      }),
    );
    expect(prisma.caregiverEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { subjectId: "user-1", visibleToPatient: true },
            { reporterId: "user-1", subjectId: { in: ["patient-2"] } },
          ],
        },
      }),
    );
    expect(prisma.caregiverAccessLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { patientId: "user-1" },
            {
              caregiverId: "user-1",
              relationshipId: { in: ["active-relationship"] },
            },
          ],
        },
      }),
    );
  });

  it("includes the current product lifecycle without exposing auth secrets", async () => {
    vi.mocked(prisma.caregiverRelationship.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(prisma.userConsent.findMany).mockResolvedValue([
      { purpose: "privacy", version: "privacy-2026-08" },
    ] as never);
    vi.mocked(prisma.moodTagDefinition.findMany).mockResolvedValue([
      { id: "tag-1", displayLabel: "Marche" },
    ] as never);
    vi.mocked(prisma.consultationPreparation.findMany).mockResolvedValue([
      { id: "consultation-1", title: "Rendez-vous" },
    ] as never);
    vi.mocked(prisma.safetyPlan.findUnique).mockResolvedValue({
      warningSigns: ["signal"],
    } as never);

    const result = await buildUserDataExport({ id: "user-1" });

    expect(result.consents).toEqual([
      expect.objectContaining({ purpose: "privacy" }),
    ]);
    expect(result.moodTags).toHaveLength(1);
    expect(result.consultationPreparations).toHaveLength(1);
    expect(result.safetyPlan).toEqual(
      expect.objectContaining({ warningSigns: ["signal"] }),
    );
    expect(result.exportMetadata.excludedSecurityData).toContain(
      "authentication sessions and credentials",
    );
  });

  it("exports appointments and calendar metadata without share-token digests", async () => {
    vi.mocked(prisma.caregiverRelationship.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([
      { id: "appointment-1", title: "Consultation" },
    ] as never);
    vi.mocked(prisma.calendarConnection.findMany).mockResolvedValue([
      { id: "calendar-1", provider: "google" },
    ] as never);

    const result = await buildUserDataExport({ id: "user-1" });

    expect(result.appointments).toEqual([
      expect.objectContaining({ id: "appointment-1" }),
    ]);
    expect(result.calendarConnections).toEqual([
      expect.objectContaining({ id: "calendar-1", provider: "google" }),
    ]);
    const appointmentSelection = JSON.stringify(
      vi.mocked(prisma.appointment.findMany).mock.calls[0]?.[0],
    );
    expect(appointmentSelection).not.toContain("tokenDigest");
    expect(appointmentSelection).not.toContain("operationId");
  });

  it("exports V2 check-ins, health aggregates and routines without raw health samples", async () => {
    vi.mocked(prisma.caregiverRelationship.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(prisma.checkIn.findMany).mockResolvedValue([
      { id: "check-in-1", depth: "quick" },
    ] as never);
    vi.mocked(prisma.dailyAggregate.findMany).mockResolvedValue([
      {
        id: "aggregate-1",
        metric: "sleep_duration",
        provenance: "healthkit",
        coverage: 0.8,
        quality: "partial",
      },
    ] as never);
    vi.mocked(prisma.routine.findMany).mockResolvedValue([
      { id: "routine-1", title: "Marcher" },
    ] as never);

    const result = await buildUserDataExport({ id: "user-1" });

    expect(result.checkIns).toEqual([
      expect.objectContaining({ id: "check-in-1" }),
    ]);
    expect(result.dailyAggregates).toEqual([
      expect.objectContaining({
        provenance: "healthkit",
        coverage: 0.8,
        quality: "partial",
      }),
    ]);
    expect(result.routines).toEqual([
      expect.objectContaining({ id: "routine-1" }),
    ]);
    expect(JSON.stringify(result)).not.toContain("health_raw_sample");
    expect(JSON.stringify(result)).not.toContain("operationId");
  });

  it("does not grant caregiver export scope without an active relationship", async () => {
    vi.mocked(prisma.caregiverRelationship.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await buildUserDataExport({ id: "user-1" });

    expect(prisma.caregiverObservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { subjectId: "user-1", visibleToPatient: true },
            { observerId: "user-1", subjectId: { in: [] } },
          ],
        },
      }),
    );
  });

  it("includes private drafts only in the full account export", async () => {
    vi.mocked(prisma.caregiverRelationship.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(prisma.userDraft.findMany).mockResolvedValue([
      {
        id: "draft-1",
        kind: "appointment_preparation",
        contextKey: "appointment-1",
        content: { question: "Question privée en cours" },
      },
    ] as never);

    const result = await buildUserDataExport({ id: "user-1" });

    expect(result.drafts).toEqual([
      expect.objectContaining({
        id: "draft-1",
        kind: "appointment_preparation",
      }),
    ]);
    expect(prisma.userDraft.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
  });

  it("uses a null timezone when preferences are absent", async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.caregiverRelationship.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const result = await buildUserDataExport({ id: "user-1" });

    expect(result.exportMetadata.timezone).toBeNull();
    expect(result.preferences).toBeNull();
  });
});
