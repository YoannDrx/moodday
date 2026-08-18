import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const actionClient = vi.hoisted(() => {
  const client = { inputSchema: vi.fn(), action: vi.fn() };
  client.inputSchema.mockReturnValue(client);
  client.action.mockImplementation((handler) => handler);
  return client;
});

vi.mock("@/lib/actions/safe-actions", () => ({ authAction: actionClient }));

import {
  listConsultationPreparations,
  saveConsultationPreparation,
  setConsultationPreparationStatus,
} from "@/features/consultation/consultation.action";

const user = { id: "consultation-user", email: "patient@moodday.invalid" };
type Handler<T = unknown> = (args: {
  parsedInput: Record<string, unknown>;
  ctx: { user: typeof user };
}) => Promise<T>;
const invoke = async <T>(handler: unknown, parsedInput = {}) =>
  (handler as Handler<T>)({ parsedInput, ctx: { user } });

describe("consultation preparation actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    actionClient.inputSchema.mockReturnValue(actionClient);
    actionClient.action.mockImplementation((handler) => handler);
  });

  it("lists only the current user's active preparations with bounded pagination", async () => {
    vi.mocked(prisma.consultationPreparation.findMany).mockResolvedValue([
      { id: "prep-1" },
    ] as never);

    await expect(
      invoke(listConsultationPreparations, { page: 3 }),
    ).resolves.toEqual([{ id: "prep-1" }]);
    expect(prisma.consultationPreparation.findMany).toHaveBeenCalledWith({
      where: { userId: user.id, status: { not: "archived" } },
      orderBy: { updatedAt: "desc" },
      skip: 40,
      take: 20,
    });
  });

  it("creates a preparation and converts its civil appointment in the user timezone", async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
      timezone: "Europe/Paris",
    } as never);
    vi.mocked(prisma.consultationPreparation.create).mockResolvedValue({
      id: "prep-new",
    } as never);

    await invoke(saveConsultationPreparation, {
      scheduledFor: "2026-10-25",
      title: "Consultation",
      questions: ["Question"],
      importantEvents: ["Événement"],
      periodStartDate: "2026-10-01",
      periodEndDate: "2026-10-25",
      status: "draft",
    });

    expect(prisma.consultationPreparation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.id,
        scheduledFor: new Date("2026-10-24T22:00:00.000Z"),
        personalNotes: null,
      }),
    });
  });

  it("updates only an owned preparation and supports an unscheduled appointment", async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.consultationPreparation.updateMany).mockResolvedValue({
      count: 1,
    } as never);
    vi.mocked(
      prisma.consultationPreparation.findUniqueOrThrow,
    ).mockResolvedValue({ id: "prep-1", title: "Suivi" } as never);

    await expect(
      invoke(saveConsultationPreparation, {
        id: "prep-1",
        scheduledFor: null,
        title: "Suivi",
        questions: [],
        importantEvents: [],
        periodStartDate: "2026-08-01",
        periodEndDate: "2026-08-13",
        personalNotes: null,
        status: "completed",
      }),
    ).resolves.toEqual({ id: "prep-1", title: "Suivi" });
    expect(prisma.consultationPreparation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prep-1", userId: user.id },
        data: expect.objectContaining({ scheduledFor: null }),
      }),
    );
  });

  it("fails closed when an update targets a missing or foreign preparation", async () => {
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.consultationPreparation.updateMany).mockResolvedValue({
      count: 0,
    } as never);

    await expect(
      invoke(saveConsultationPreparation, {
        id: "foreign",
        title: "Inaccessible",
        questions: [],
        importantEvents: [],
        periodStartDate: "2026-08-01",
        periodEndDate: "2026-08-13",
        status: "draft",
      }),
    ).rejects.toThrow("Preparation not found");
  });

  it("changes status only for one owned preparation", async () => {
    vi.mocked(prisma.consultationPreparation.updateMany)
      .mockResolvedValueOnce({ count: 1 } as never)
      .mockResolvedValueOnce({ count: 0 } as never);

    await expect(
      invoke(setConsultationPreparationStatus, {
        id: "prep-1",
        status: "archived",
      }),
    ).resolves.toEqual({ id: "prep-1", status: "archived" });
    await expect(
      invoke(setConsultationPreparationStatus, {
        id: "foreign",
        status: "completed",
      }),
    ).rejects.toThrow("Preparation not found");
  });
});
