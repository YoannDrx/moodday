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
  createTherapySession,
  deleteTherapySession,
  getTherapySessionById,
  getTherapySessions,
  updateTherapySession,
} from "@/features/therapy/therapy.action";
import {
  saveMoodTagDefinition,
  searchJournal,
} from "@/features/mood/journal-search.action";

const user = { id: "user-1", email: "user@moodday.invalid" };
type Handler<T = unknown> = (args: {
  parsedInput: Record<string, unknown>;
  ctx: { user: typeof user };
}) => Promise<T>;
const invoke = async <T>(handler: unknown, parsedInput = {}) =>
  (handler as Handler<T>)({ parsedInput, ctx: { user } });

describe("therapy actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
      timezone: "Europe/Paris",
    } as never);
  });

  it("creates online and idempotent offline sessions on civil dates", async () => {
    vi.mocked(prisma.therapySession.create).mockResolvedValue({
      id: "therapy-1",
    } as never);
    await invoke(createTherapySession, {
      date: "2026-08-10",
      notes: "Séance utile",
      benefitRating: 5,
    });
    expect(prisma.therapySession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.id,
        clientOperationId: null,
        syncStatus: "synced",
        date: expect.any(Date),
      }),
    });

    vi.mocked(prisma.therapySession.upsert).mockResolvedValue({
      id: "therapy-2",
    } as never);
    await invoke(createTherapySession, {
      operationId: "operation-1",
      date: new Date("2026-08-11T12:00:00.000Z"),
      notes: "Hors ligne",
    });
    expect(prisma.therapySession.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_clientOperationId: {
            userId: user.id,
            clientOperationId: "operation-1",
          },
        },
        update: {},
      }),
    );
  });

  it("rejects future civil dates", async () => {
    await expect(
      invoke(createTherapySession, {
        date: "2999-01-01",
        notes: "Impossible",
      }),
    ).rejects.toThrow("cannot be in the future");
  });

  it("updates and deletes an owned session", async () => {
    vi.mocked(prisma.therapySession.findUnique).mockResolvedValue({
      id: "therapy-1",
      userId: user.id,
    } as never);
    vi.mocked(prisma.therapySession.update).mockResolvedValue({
      id: "therapy-1",
    } as never);
    await invoke(updateTherapySession, {
      id: "therapy-1",
      date: "2026-08-10",
      notes: "Corrigée",
      benefitRating: null,
    });
    expect(prisma.therapySession.update).toHaveBeenCalledWith({
      where: { id: "therapy-1" },
      data: expect.objectContaining({
        date: expect.any(Date),
        notes: "Corrigée",
        benefitRating: null,
      }),
    });

    vi.mocked(prisma.therapySession.delete).mockResolvedValue({} as never);
    await expect(
      invoke(deleteTherapySession, { id: "therapy-1" }),
    ).resolves.toEqual({ success: true });
  });

  it("protects update and delete ownership and missing resources", async () => {
    vi.mocked(prisma.therapySession.findUnique).mockResolvedValueOnce(null);
    await expect(
      invoke(updateTherapySession, {
        id: "missing",
        date: "2026-08-10",
        notes: "X",
      }),
    ).rejects.toThrow("Session not found");
    vi.mocked(prisma.therapySession.findUnique).mockResolvedValueOnce({
      userId: "another-user",
    } as never);
    await expect(
      invoke(deleteTherapySession, { id: "therapy-1" }),
    ).rejects.toThrow("delete your own sessions");

    vi.mocked(prisma.therapySession.findUnique).mockResolvedValueOnce(null);
    await expect(
      invoke(deleteTherapySession, { id: "missing" }),
    ).rejects.toThrow("Session not found");
  });

  it("lists paginated sessions with timezone and reads an owned detail", async () => {
    vi.mocked(prisma.therapySession.findMany).mockResolvedValue([
      { id: "therapy-1" },
    ] as never);
    vi.mocked(prisma.therapySession.count).mockResolvedValue(1);
    await expect(
      invoke(getTherapySessions, { limit: 20, offset: 0 }),
    ).resolves.toEqual({
      sessions: [{ id: "therapy-1" }],
      total: 1,
      timezone: "Europe/Paris",
    });

    vi.mocked(prisma.therapySession.findUnique).mockResolvedValue({
      id: "therapy-1",
      userId: user.id,
    } as never);
    await expect(
      invoke(getTherapySessionById, { id: "therapy-1" }),
    ).resolves.toEqual(expect.objectContaining({ id: "therapy-1" }));
  });

  it("protects detail reads", async () => {
    vi.mocked(prisma.therapySession.findUnique).mockResolvedValueOnce(null);
    await expect(
      invoke(getTherapySessionById, { id: "missing" }),
    ).rejects.toThrow("Session not found");
    vi.mocked(prisma.therapySession.findUnique).mockResolvedValueOnce({
      userId: "another-user",
    } as never);
    await expect(
      invoke(getTherapySessionById, { id: "therapy-1" }),
    ).rejects.toThrow("view your own sessions");
  });
});

describe("journal search actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
      timezone: "Europe/Paris",
    } as never);
  });

  it("normalizes and restores a custom mood tag", async () => {
    vi.mocked(prisma.moodTagDefinition.upsert).mockResolvedValue({
      id: "tag-1",
    } as never);
    await invoke(saveMoodTagDefinition, {
      displayLabel: "  TRAVAIL  ",
      category: "context",
      color: undefined,
    });
    expect(prisma.moodTagDefinition.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_normalizedLabel_category: {
            userId: user.id,
            normalizedLabel: "travail",
            category: "context",
          },
        },
        update: expect.objectContaining({ isArchived: false, color: null }),
      }),
    );
  });

  it("builds bounded server-side text, tag, mood and civil-date filters", async () => {
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([
      { id: "mood-1", value: 0 },
    ] as never);
    await expect(
      invoke(searchJournal, {
        query: "travail",
        tags: ["protective"],
        moodMin: 0,
        moodMax: 6,
        start: "2026-08-01",
        end: "2026-08-13",
        page: 2,
        pageSize: 30,
      }),
    ).resolves.toEqual({
      entries: [{ id: "mood-1", value: 0 }],
      timezone: "Europe/Paris",
    });
    expect(prisma.moodEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: user.id,
          note: { contains: "travail", mode: "insensitive" },
          tags: { hasEvery: ["protective"] },
          value: { gte: 0, lte: 6 },
          createdAt: { gte: expect.any(Date), lt: expect.any(Date) },
        }),
        skip: 30,
        take: 30,
      }),
    );
  });

  it("supports an unfiltered search and rejects inverted or oversized ranges", async () => {
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([]);
    await invoke(searchJournal, {
      query: "",
      tags: [],
      page: 1,
      pageSize: 10,
    });
    expect(prisma.moodEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ note: expect.anything() }),
      }),
    );

    await expect(
      invoke(searchJournal, {
        query: "",
        tags: [],
        start: "2026-08-13",
        end: "2026-08-01",
        page: 1,
        pageSize: 10,
      }),
    ).rejects.toThrow("1 to 365 days");
    await expect(
      invoke(searchJournal, {
        query: "",
        tags: [],
        start: "2025-01-01",
        end: "2026-08-13",
        page: 1,
        pageSize: 10,
      }),
    ).rejects.toThrow("1 to 365 days");
  });
});
