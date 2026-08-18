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
        dataVersion: "2.2",
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
