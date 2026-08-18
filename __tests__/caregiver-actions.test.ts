import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const actionClient = vi.hoisted(() => {
  const client = {
    use: vi.fn(),
    inputSchema: vi.fn(),
    action: vi.fn(),
  };
  client.use.mockReturnValue(client);
  client.inputSchema.mockReturnValue(client);
  client.action.mockImplementation((handler) => handler);
  return client;
});

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  enforceRateLimit: vi.fn(),
  authorizeCaregiverRelationship: vi.fn(),
  recordCaregiverResourceAccess: vi.fn(),
  recordCaregiverSharedSpaceAccess: vi.fn(),
  getMedicationAdherenceForUser: vi.fn(),
}));

vi.mock("@/lib/actions/safe-actions", () => ({
  action: actionClient,
  authAction: actionClient,
  sensitiveAuthAction: actionClient,
}));
vi.mock("@/lib/mail/send-email", () => ({ sendEmail: mocks.sendEmail }));
vi.mock("@email/markdown.email", () => ({
  default: ({ markdown }: { markdown: string }) => markdown,
}));
vi.mock("@/lib/server-url", () => ({
  getServerUrl: () => "https://moodday.invalid",
}));
vi.mock("@/i18n/server", () => ({
  getI18n: async () => ({
    locale: "fr",
    t: (key: string) => key,
  }),
}));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
}));
vi.mock("@/lib/features/availability", () => ({
  assertFeatureAvailable: vi.fn(),
}));
vi.mock("@/features/caregiver/authorization", () => ({
  authorizeCaregiverRelationship: mocks.authorizeCaregiverRelationship,
}));
vi.mock("@/features/caregiver/access-log", () => ({
  CAREGIVER_ACCESS_RESOURCES: {
    sharedSpace: "shared_space",
    activity: "activity",
    moodSummary: "mood_summary",
    medicationSummary: "medication_summary",
  },
  recordCaregiverResourceAccess: mocks.recordCaregiverResourceAccess,
  recordCaregiverSharedSpaceAccess: mocks.recordCaregiverSharedSpaceAccess,
}));
vi.mock("@/features/medication/adherence-service", () => ({
  getMedicationAdherenceForUser: mocks.getMedicationAdherenceForUser,
}));
vi.mock("@/lib/env", () => ({
  env: {
    LEGAL_PRIVACY_VERSION: "privacy-test",
    LAUNCH_COUNTRY: "FR",
  },
}));

import {
  acceptCaregiverInvitation,
  createEvent,
  createObservation,
  declineCaregiverInvitation,
  getCaregiverAccessLog,
  getCaregiverActivity,
  getCaregiverDigestPreferences,
  getCaregiverInviteInfo,
  getCaregiverSummary,
  getMyCaregivers,
  getMyPatients,
  getReceivedObservations,
  getSharedMedicationSummary,
  getSharedMoodSummary,
  inviteCaregiver,
  removeCaregiverRelationship,
  updateCaregiverPermissions,
  updateCaregiverDigestPreferences,
} from "@/features/caregiver/caregiver.action";

type ActionHandler<T = unknown> = (args: {
  parsedInput?: Record<string, unknown>;
  ctx: { user: typeof patient | typeof caregiver };
}) => Promise<T>;

const invoke = async <T>(
  handler: unknown,
  args: Parameters<ActionHandler<T>>[0],
) => (handler as ActionHandler<T>)(args);

const patient = {
  id: "patient-1",
  email: "patient@moodday.invalid",
  name: "Patient",
};
const caregiver = {
  id: "caregiver-1",
  email: "caregiver@moodday.invalid",
  name: "Aidant",
};
const createdAt = new Date("2026-08-10T10:00:00.000Z");
const relationship = {
  id: "relationship-1",
  patientId: patient.id,
  caregiverId: caregiver.id,
  caregiverEmail: caregiver.email,
  status: "active",
  role: "family",
  label: "Proche",
  permissions: [
    "view_mood",
    "view_medications",
    "add_observations",
    "add_events",
  ],
  accessExpiresAt: null,
  revokedAt: null,
  revokedById: null,
  inviteToken: null,
  inviteExpiry: null,
  moodWindowDays: 30,
  medicationWindowDays: 30,
  createdAt,
};

beforeEach(() => {
  vi.clearAllMocks();
  actionClient.use.mockReturnValue(actionClient);
  actionClient.inputSchema.mockReturnValue(actionClient);
  actionClient.action.mockImplementation((handler) => handler);
  vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
    typeof callback === "function"
      ? callback(prisma as never)
      : Promise.all(callback),
  );
  mocks.authorizeCaregiverRelationship.mockResolvedValue({
    relationship,
    readOnly: false,
  });
  mocks.getMedicationAdherenceForUser.mockResolvedValue({
    expected: 2,
    taken: 1,
    percent: 50,
  });
});

describe("caregiver actions", () => {
  it("reads safe digest defaults and persists explicit preferences", async () => {
    vi.mocked(prisma.userPreferences.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        caregiverAccessDigestEnabled: false,
        caregiverAccessDigestFrequency: "daily",
      } as never);

    await expect(
      invoke(getCaregiverDigestPreferences, { ctx: { user: patient } }),
    ).resolves.toEqual({ enabled: true, frequency: "weekly" });
    await expect(
      invoke(getCaregiverDigestPreferences, { ctx: { user: patient } }),
    ).resolves.toEqual({ enabled: false, frequency: "daily" });

    vi.mocked(prisma.userPreferences.upsert).mockResolvedValue({} as never);
    await expect(
      invoke(updateCaregiverDigestPreferences, {
        parsedInput: { enabled: true, frequency: "daily" },
        ctx: { user: patient },
      }),
    ).resolves.toEqual({ enabled: true, frequency: "daily" });
    expect(prisma.userPreferences.upsert).toHaveBeenCalledWith({
      where: { userId: patient.id },
      update: {
        caregiverAccessDigestEnabled: true,
        caregiverAccessDigestFrequency: "daily",
      },
      create: {
        userId: patient.id,
        caregiverAccessDigestEnabled: true,
        caregiverAccessDigestFrequency: "daily",
      },
    });
  });

  it("covers invitation creation, inspection, acceptance and decline", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.caregiverRelationship.findFirst).mockResolvedValueOnce(
      null,
    );
    vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.caregiverRelationship.count).mockResolvedValueOnce(0);
    vi.mocked(prisma.caregiverRelationship.create).mockResolvedValueOnce({
      ...relationship,
      id: "pending-1",
      caregiverId: null,
      status: "pending",
    } as never);
    vi.mocked(prisma.userConsent.createMany).mockResolvedValue({ count: 1 });

    const invited = await invoke<{ id: string; caregiverExists: boolean }>(
      inviteCaregiver,
      {
        parsedInput: {
          email: ` ${caregiver.email.toUpperCase()} `,
          role: "family",
          label: "Proche",
          permissions: ["view_mood"],
          moodWindowDays: 30,
          medicationWindowDays: 30,
        },
        ctx: { user: patient },
      },
    );
    expect(invited).toMatchObject({ id: "pending-1", caregiverExists: false });
    expect(mocks.sendEmail).toHaveBeenCalledOnce();

    vi.mocked(prisma.caregiverRelationship.findUnique).mockResolvedValueOnce({
      ...relationship,
      status: "pending",
      inviteToken: "invite-token",
      inviteExpiry: null,
      patient: { name: patient.name, email: patient.email, image: null },
    } as never);
    const info = await invoke<{ patientEmail: string }>(
      getCaregiverInviteInfo,
      {
        parsedInput: { inviteToken: "invite-token" },
        ctx: { user: caregiver },
      },
    );
    expect(info.patientEmail).toBe(patient.email);

    vi.mocked(prisma.caregiverRelationship.findUnique).mockResolvedValueOnce({
      ...relationship,
      status: "pending",
      inviteToken: "invite-token",
      patient: { name: patient.name },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      email: caregiver.email,
      emailVerified: true,
    } as never);
    vi.mocked(prisma.caregiverRelationship.updateMany).mockResolvedValueOnce({
      count: 1,
    });
    await expect(
      invoke(acceptCaregiverInvitation, {
        parsedInput: { inviteToken: "invite-token" },
        ctx: { user: caregiver },
      }),
    ).resolves.toMatchObject({ patientName: patient.name });

    vi.mocked(prisma.caregiverRelationship.findUnique).mockResolvedValueOnce({
      ...relationship,
      status: "pending",
      inviteToken: "second-token",
    } as never);
    vi.mocked(prisma.caregiverRelationship.update).mockResolvedValueOnce({
      ...relationship,
      status: "declined",
    } as never);
    await expect(
      invoke(declineCaregiverInvitation, {
        parsedInput: { inviteToken: "second-token" },
        ctx: { user: caregiver },
      }),
    ).resolves.toEqual({ success: true });
  });

  it("lists patient and caregiver spaces with safe access metadata", async () => {
    vi.mocked(prisma.caregiverRelationship.findMany)
      .mockResolvedValueOnce([
        {
          ...relationship,
          caregiver: {
            id: caregiver.id,
            name: caregiver.name,
            email: caregiver.email,
            image: null,
          },
        },
      ] as never)
      .mockResolvedValueOnce([{ id: relationship.id }] as never);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(null);
    const caregivers = await invoke<{ caregiverName: string }[]>(
      getMyCaregivers,
      { ctx: { user: patient } },
    );
    expect(caregivers[0]?.caregiverName).toBe(caregiver.name);

    vi.mocked(prisma.caregiverRelationship.findMany)
      .mockResolvedValueOnce([
        {
          ...relationship,
          patient: {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            image: null,
          },
        },
      ] as never)
      .mockResolvedValueOnce([{ id: relationship.id }] as never);
    vi.mocked(prisma.subscription.findUnique).mockResolvedValueOnce(null);
    const patients = await invoke<{ patientName: string }[]>(getMyPatients, {
      ctx: { user: caregiver },
    });
    expect(patients[0]?.patientName).toBe(patient.name);
    expect(mocks.recordCaregiverSharedSpaceAccess).toHaveBeenCalledOnce();

    vi.mocked(prisma.caregiverAccessLog.findMany).mockResolvedValueOnce([
      {
        id: "access-1",
        resource: "mood_summary",
        accessedAt: createdAt,
        caregiver: { name: caregiver.name, image: null },
        relationship: { label: "Proche" },
      },
    ] as never);
    const log = await invoke<{ caregiverName: string }[]>(
      getCaregiverAccessLog,
      {
        parsedInput: { limit: 20 },
        ctx: { user: patient },
      },
    );
    expect(log[0]?.caregiverName).toBe("Proche");
  });

  it("updates and immediately revokes an owned relationship", async () => {
    const accessExpiresAt = "2026-09-15T10:00:00.000Z";
    vi.mocked(prisma.caregiverRelationship.findUnique).mockResolvedValue(
      relationship as never,
    );
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.caregiverRelationship.findMany).mockResolvedValue([
      { id: relationship.id },
    ] as never);
    vi.mocked(prisma.caregiverRelationship.update).mockResolvedValue({
      ...relationship,
      permissions: ["view_mood"],
      accessExpiresAt: new Date(accessExpiresAt),
      moodWindowDays: 7,
      medicationWindowDays: 90,
    } as never);

    await expect(
      invoke(updateCaregiverPermissions, {
        parsedInput: {
          relationshipId: relationship.id,
          permissions: ["view_mood"],
          label: "Famille",
          accessExpiresAt,
          moodWindowDays: 7,
          medicationWindowDays: 90,
        },
        ctx: { user: patient },
      }),
    ).resolves.toMatchObject({
      permissions: ["view_mood"],
      accessExpiresAt,
      moodWindowDays: 7,
      medicationWindowDays: 90,
    });
    expect(prisma.caregiverRelationship.update).toHaveBeenCalledWith({
      where: { id: relationship.id },
      data: {
        permissions: ["view_mood"],
        label: "Famille",
        accessExpiresAt: new Date(accessExpiresAt),
        moodWindowDays: 7,
        medicationWindowDays: 90,
      },
    });

    await expect(
      invoke(removeCaregiverRelationship, {
        parsedInput: { relationshipId: relationship.id },
        ctx: { user: patient },
      }),
    ).resolves.toEqual({ success: true });
    expect(prisma.caregiverRelationship.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "revoked",
          revokedById: patient.id,
          inviteToken: null,
        }),
      }),
    );
  });

  it("creates authorized observations and events", async () => {
    vi.mocked(prisma.caregiverObservation.create).mockResolvedValueOnce({
      id: "observation-1",
    } as never);
    vi.mocked(prisma.caregiverEvent.create).mockResolvedValueOnce({
      id: "event-1",
    } as never);

    await expect(
      invoke(createObservation, {
        parsedInput: {
          relationshipId: relationship.id,
          moodObserved: "stable",
          energyObserved: "medium",
          socialBehavior: "connected",
          sleepObserved: "normal",
          notes: "synthetic",
          visibleToPatient: true,
        },
        ctx: { user: caregiver },
      }),
    ).resolves.toEqual({ id: "observation-1" });
    await expect(
      invoke(createEvent, {
        parsedInput: {
          relationshipId: relationship.id,
          eventType: "appointment",
          severity: 2,
          description: "synthetic",
          eventDate: "2026-08-10T09:00:00.000Z",
          visibleToPatient: true,
        },
        ctx: { user: caregiver },
      }),
    ).resolves.toEqual({ id: "event-1" });
  });

  it("returns bounded activity, received observations and summary counts", async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
      timezone: "Europe/Paris",
    } as never);
    vi.mocked(prisma.caregiverObservation.findMany).mockResolvedValue([
      {
        id: "observation-1",
        subject: { name: patient.name, image: null },
        observer: { name: caregiver.name, image: null },
        moodObserved: "stable",
        energyObserved: "medium",
        socialBehavior: "connected",
        sleepObserved: "normal",
        notes: "synthetic",
        createdAt,
      },
    ] as never);
    vi.mocked(prisma.caregiverEvent.findMany).mockResolvedValue([
      {
        id: "event-1",
        subject: { name: patient.name, image: null },
        reporter: { name: caregiver.name, image: null },
        eventType: "appointment",
        severity: 2,
        description: "synthetic",
        eventDate: createdAt,
        createdAt: new Date(createdAt.getTime() + 1000),
      },
    ] as never);

    const activity = await invoke<{ type: string }[]>(getCaregiverActivity, {
      parsedInput: {
        days: 30,
        limit: 20,
        scope: { kind: "relationship", relationshipId: relationship.id },
      },
      ctx: { user: caregiver },
    });
    expect(activity.map(({ type }) => type)).toEqual(["event", "observation"]);

    const received = await invoke<{ observerName: string }[]>(
      getReceivedObservations,
      {
        parsedInput: { days: 30, limit: 20 },
        ctx: { user: patient },
      },
    );
    expect(received[0]?.observerName).toBe(caregiver.name);

    vi.mocked(prisma.caregiverObservation.count)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    vi.mocked(prisma.caregiverEvent.count)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);
    await expect(
      invoke(getCaregiverSummary, {
        parsedInput: {
          scope: { kind: "relationship", relationshipId: relationship.id },
        },
        ctx: { user: caregiver },
      }),
    ).resolves.toEqual({
      observationsThisWeek: 1,
      observationsThisMonth: 2,
      eventsThisMonth: 3,
      concerningEvents: 1,
    });
  });

  it("shares only bounded mood and medication aggregates", async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
      timezone: "Europe/Paris",
    } as never);
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([
      { value: 0, energy: null, anxiety: 2, createdAt },
      { value: 4, energy: 6, anxiety: 1, createdAt },
    ] as never);
    const mood = await invoke<{
      days: number;
      daily: { moodAverage: number; energyAverage: number | null }[];
    }>(getSharedMoodSummary, {
      parsedInput: { relationshipId: relationship.id, days: 90 },
      ctx: { user: caregiver },
    });
    expect(mood.days).toBe(30);
    expect(mood.daily[0]).toMatchObject({
      moodAverage: 2,
      energyAverage: 6,
    });

    vi.mocked(prisma.medication.findMany).mockResolvedValue([
      {
        id: "medication-1",
        name: "Synthetic",
        dosage: "fixture",
        frequency: "daily",
        isArchived: false,
        intakes: [{ id: "intake-1" }],
      },
    ] as never);
    const medications = await invoke<{
      days: number;
      adherencePercent: number | null;
      medications: { active: boolean; takenCount: number }[];
    }>(getSharedMedicationSummary, {
      parsedInput: { relationshipId: relationship.id, days: 90 },
      ctx: { user: caregiver },
    });
    expect(medications).toMatchObject({
      days: 30,
      adherencePercent: 50,
      medications: [{ active: true, takenCount: 1 }],
    });
  });
});
