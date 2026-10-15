import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SyncPushOperation } from "@moodday/contracts";
import { prisma } from "@/lib/prisma";
import {
  pushSyncOperations,
  pullSyncChanges,
} from "@/features/v2/sync/service";
import { syncOperationDigest } from "@/features/v2/sync/operation-identity";

const now = new Date("2026-10-02T10:00:00Z");
const owned = {
  id: "entity-0001",
  userId: "user-1",
  updatedAt: now,
  createdAt: now,
};
const payloads = {
  routine: { title: "Walk", status: "active" },
  appointment: {
    title: "Visit",
    startsAt: now.toISOString(),
    timezone: "Europe/Paris",
  },
  user_draft: {
    kind: "check_in",
    contextKey: "2026-10-02",
    content: { note: "private draft" },
  },
  routine_occurrence: {
    routineId: "routine-0001",
    localDate: "2026-10-02",
    timezone: "Europe/Paris",
    status: "skipped",
  },
  user_preferences: {
    locale: "fr",
    timezone: null,
    reducedMotion: false,
    preferredTextScale: "system",
    notificationsEnabled: false,
    dailyCheckInReminder: false,
    dailyCheckInTime: "20:00",
    medicationReminders: false,
    medicationReminderTime: "08:00",
  },
};
const delegates = {
  routine: prisma.routine,
  appointment: prisma.appointment,
  user_draft: prisma.userDraft,
  routine_occurrence: prisma.routineOccurrence,
  user_preferences: prisma.userPreferences,
};
const run = async (
  entityType: SyncPushOperation["entityType"],
  mutation: SyncPushOperation["mutation"],
  payload: unknown,
  baseVersion: string | null = now.toISOString(),
) =>
  (
    await pushSyncOperations("user-1", {
      deviceId: "device-0001",
      platform: "ios",
      operations: [
        {
          operationId: "operation-0001",
          entityId: "entity-0001",
          entityType,
          mutation,
          payload,
          baseVersion,
        },
      ],
    })
  ).results[0];
const currentFor = (type: keyof typeof delegates, userId = "user-1") =>
  type === "routine_occurrence"
    ? {
        ...owned,
        routine: { userId },
        routineId: "routine-0001",
        localDate: "2026-10-02",
      }
    : { ...owned, userId };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
    callback(prisma),
  );
  vi.mocked(prisma.device.upsert).mockResolvedValue({
    id: "device-db",
    revokedAt: null,
  } as never);
  vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue(null);
  vi.mocked(prisma.syncOperation.create).mockResolvedValue({} as never);
  for (const delegate of Object.values(delegates)) {
    vi.mocked(delegate.findUnique).mockResolvedValue(null);
    vi.mocked(delegate.create).mockResolvedValue(owned as never);
    vi.mocked(delegate.update).mockResolvedValue(owned as never);
  }
});

describe("offline mutation authorization and version policy", () => {
  it.each([
    "routine",
    "appointment",
    "user_draft",
    "routine_occurrence",
  ] as const)("rejects another owner's %s without a write", async (type) => {
    vi.mocked(delegates[type].findUnique).mockResolvedValue(
      currentFor(type, "other") as never,
    );
    expect(await run(type, "update", payloads[type])).toMatchObject({
      status: "rejected",
      code: "entity_not_found",
    });
    expect(delegates[type].update).not.toHaveBeenCalled();
  });
  it.each(Object.keys(delegates) as (keyof typeof delegates)[])(
    "requires a current base version for %s",
    async (type) => {
      vi.mocked(delegates[type].findUnique).mockResolvedValue(
        currentFor(type) as never,
      );
      expect(await run(type, "update", payloads[type], null)).toMatchObject({
        status: "conflict",
        code: "version_conflict",
      });
      expect(delegates[type].update).not.toHaveBeenCalled();
    },
  );
  it.each([
    "routine",
    "appointment",
    "user_draft",
    "routine_occurrence",
  ] as const)("rejects updates/deletes for missing %s", async (type) => {
    expect(await run(type, "update", payloads[type])).toMatchObject({
      status: "rejected",
      code: "entity_not_found",
    });
    expect(await run(type, "delete", null)).toMatchObject({
      status: "rejected",
      code: "entity_not_found",
    });
  });
  it.each(Object.keys(delegates) as (keyof typeof delegates)[])(
    "validates malformed %s payloads",
    async (type) => {
      expect(await run(type, "create", { unexpected: true })).toMatchObject({
        status: "rejected",
      });
      vi.mocked(delegates[type].findUnique).mockResolvedValue(
        currentFor(type) as never,
      );
      expect(await run(type, "update", { unexpected: true })).toMatchObject({
        status: "rejected",
      });
      expect(delegates[type].update).not.toHaveBeenCalled();
    },
  );
  it.each(Object.keys(delegates) as (keyof typeof delegates)[])(
    "applies a valid creation and versioned update of %s",
    async (type) => {
      vi.mocked(prisma.routine.findFirst).mockResolvedValue({
        id: "routine-0001",
      } as never);
      expect(await run(type, "create", payloads[type])).toMatchObject({
        status: "applied",
      });
      expect(delegates[type].create).toHaveBeenCalled();
      vi.mocked(delegates[type].findUnique).mockResolvedValue(
        currentFor(type) as never,
      );
      expect(await run(type, "update", payloads[type])).toMatchObject({
        status: "applied",
      });
      expect(delegates[type].update).toHaveBeenCalled();
    },
  );
  it.each(Object.keys(delegates) as (keyof typeof delegates)[])(
    "does not create over an existing %s",
    async (type) => {
      vi.mocked(delegates[type].findUnique).mockResolvedValue(
        currentFor(type) as never,
      );
      expect(await run(type, "create", payloads[type])).toMatchObject({
        status: "conflict",
      });
      expect(delegates[type].create).not.toHaveBeenCalled();
    },
  );
  it.each([
    "routine",
    "appointment",
    "user_draft",
    "routine_occurrence",
  ] as const)("applies a versioned deletion for %s", async (type) => {
    vi.mocked(delegates[type].findUnique).mockResolvedValue(
      currentFor(type) as never,
    );
    expect(await run(type, "delete", null)).toMatchObject({
      status: "applied",
    });
    expect(prisma.syncOperation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mutation: "delete",
          status: "applied",
        }),
      }),
    );
  });
  it("forbids deleting preferences and rebinding a routine occurrence", async () => {
    expect(await run("user_preferences", "delete", null)).toMatchObject({
      code: "preferences_cannot_be_deleted",
    });
    vi.mocked(prisma.routineOccurrence.findUnique).mockResolvedValue(
      currentFor("routine_occurrence") as never,
    );
    expect(
      await run("routine_occurrence", "update", {
        ...payloads.routine_occurrence,
        localDate: "2026-10-03",
      }),
    ).toMatchObject({ code: "immutable_occurrence_identity" });
  });
  it("rejects oversized drafts, conflicting context identities and preference identities", async () => {
    expect(
      await run("user_draft", "create", {
        ...payloads.user_draft,
        content: { note: "x".repeat(100_000) },
      }),
    ).toMatchObject({ code: "draft_content_too_large" });
    vi.mocked(prisma.userDraft.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(owned as never);
    expect(
      await run("user_draft", "create", payloads.user_draft),
    ).toMatchObject({ code: "draft_context_exists" });
    expect(
      await run("user_preferences", "update", payloads.user_preferences),
    ).toMatchObject({ code: "entity_not_found" });
    vi.mocked(prisma.userPreferences.findUnique).mockResolvedValue({
      ...owned,
      id: "another-preference",
    } as never);
    expect(
      await run("user_preferences", "update", payloads.user_preferences),
    ).toMatchObject({ code: "preferences_entity_mismatch" });
  });
  it("rejects revoked devices before applying any operation", async () => {
    vi.mocked(prisma.device.upsert).mockResolvedValue({
      revokedAt: now,
    } as never);
    await expect(run("routine", "create", payloads.routine)).rejects.toThrow(
      "revoked",
    );
    expect(prisma.syncOperation.create).not.toHaveBeenCalled();
  });
  it("binds retries to entity identity, mutation, base version and payload", async () => {
    const operation: SyncPushOperation = {
      operationId: "operation-0001",
      entityId: "entity-0001",
      entityType: "routine",
      mutation: "update",
      baseVersion: now.toISOString(),
      payload: payloads.routine,
    };
    vi.mocked(prisma.syncOperation.findUnique).mockResolvedValue({
      ...operation,
      payloadDigest: syncOperationDigest(operation),
      status: "applied",
    } as never);
    expect(await run("routine", "update", payloads.routine)).toMatchObject({
      status: "duplicate",
    });
    expect(
      await run("routine", "update", payloads.routine, null),
    ).toMatchObject({ code: "operation_id_conflict" });
    expect(await run("routine", "delete", payloads.routine)).toMatchObject({
      code: "operation_id_conflict",
    });
    expect(prisma.routine.update).not.toHaveBeenCalled();
  });
});

it("paginates pull receipts deterministically and keeps tombstones without leaking missing entities", async () => {
  const receipt = {
    id: "receipt-1",
    operationId: "operation-1",
    entityId: "entity-1",
    entityType: "check_in",
    mutation: "delete",
    createdAt: now,
  };
  vi.mocked(prisma.syncOperation.findMany).mockResolvedValue([
    receipt,
    { ...receipt, id: "receipt-2" },
  ] as never);
  const first = await pullSyncChanges({ userId: "user-1", limit: 1 });
  expect(first).toMatchObject({ changes: [{ data: null }], hasMore: true });
  expect(first.nextCursor).toBeTruthy();
  vi.mocked(prisma.syncOperation.findMany).mockResolvedValue([]);
  expect(
    await pullSyncChanges({
      userId: "user-1",
      limit: 1,
      cursor: first.nextCursor ?? undefined,
    }),
  ).toMatchObject({
    changes: [],
    nextCursor: first.nextCursor,
    hasMore: false,
  });
  await expect(
    pullSyncChanges({ userId: "user-1", limit: 1, cursor: "bad" }),
  ).rejects.toThrow("invalid");
});

const artifacts = [
  {
    type: "appointment_question" as const,
    delegate: prisma.appointmentQuestion,
    payload: {
      appointmentId: "appointment-0001",
      content: "Question",
      privateNote: true,
    },
  },
  {
    type: "appointment_event" as const,
    delegate: prisma.appointmentEvent,
    payload: {
      appointmentId: "appointment-0001",
      type: "session_started",
      occurredAt: now.toISOString(),
    },
  },
  {
    type: "appointment_decision" as const,
    delegate: prisma.appointmentDecision,
    payload: {
      appointmentId: "appointment-0001",
      summary: "Decision",
      status: "completed",
      includeInBrief: false,
      dueAt: now.toISOString(),
    },
  },
];
it.each(artifacts)(
  "keeps $type append-only, owned and idempotent",
  async ({ type, delegate, payload }) => {
    expect(await run(type, "delete", null)).toMatchObject({
      code: "append_only_entity",
    });
    expect(await run(type, "create", null)).toMatchObject({
      code: "invalid_appointment_artifact",
    });
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null);
    expect(await run(type, "create", payload)).toMatchObject({
      code: "entity_not_found",
    });
    vi.mocked(prisma.appointment.findFirst).mockResolvedValue({
      id: "appointment-0001",
    } as never);
    expect(
      await run(type, "create", { appointmentId: "appointment-0001" }),
    ).toMatchObject({ status: "rejected" });
    vi.mocked(delegate.findUnique).mockResolvedValue({
      ...owned,
      appointment: { userId: "another-user" },
    } as never);
    expect(await run(type, "create", payload)).toMatchObject({
      code: "entity_not_found",
    });
    vi.mocked(delegate.findUnique).mockResolvedValue({
      ...owned,
      appointment: { userId: "user-1" },
    } as never);
    expect(await run(type, "create", payload)).toMatchObject({
      code: "entity_id_exists",
    });
    vi.mocked(delegate.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.appointmentQuestion.aggregate).mockResolvedValue({
      _max: { position: null },
    } as never);
    vi.mocked(delegate.create).mockResolvedValue(owned as never);
    expect(await run(type, "create", payload)).toMatchObject({
      status: "applied",
    });
    expect(delegate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          appointmentId: "appointment-0001",
          operationId: "operation-0001",
        }),
      }),
    );
  },
);
it("keeps check-ins append-only and rejects invalid or occupied entity identifiers", async () => {
  expect(await run("check_in", "delete", null)).toMatchObject({
    code: "append_only_entity",
  });
  expect(await run("check_in", "create", null)).toMatchObject({
    code: "invalid_check_in",
  });
  const payload = {
    depth: "presence",
    localDate: "2026-10-02",
    timezone: "Europe/Paris",
    contexts: [],
  };
  vi.mocked(prisma.checkIn.findUnique).mockResolvedValue({
    ...owned,
    userId: "other",
  } as never);
  expect(await run("check_in", "create", payload)).toMatchObject({
    code: "entity_not_found",
  });
  vi.mocked(prisma.checkIn.findUnique).mockResolvedValue(owned as never);
  expect(await run("check_in", "create", payload)).toMatchObject({
    code: "entity_id_exists",
  });
  vi.mocked(prisma.checkIn.findUnique).mockResolvedValue(null);
  vi.mocked(prisma.checkIn.create).mockResolvedValue(owned as never);
  expect(await run("check_in", "create", payload)).toMatchObject({
    status: "applied",
  });
});
const readableEntities = [
  ["check_in", prisma.checkIn],
  ["medication", prisma.medication],
  ["dose_event", prisma.medIntake],
  ["dose_event_correction", prisma.medicationIntakeRevision],
  ["medication_inventory_event", prisma.medicationInventoryEvent],
  ["user_draft", prisma.userDraft],
  ["routine", prisma.routine],
  ["routine_occurrence", prisma.routineOccurrence],
  ["appointment", prisma.appointment],
  ["appointment_question", prisma.appointmentQuestion],
  ["appointment_event", prisma.appointmentEvent],
  ["appointment_decision", prisma.appointmentDecision],
] as const;
it.each(readableEntities)(
  "never hydrates another account's %s into a pulled receipt",
  async (type, delegate) => {
    vi.mocked(prisma.syncOperation.findMany).mockResolvedValue([
      {
        ...owned,
        entityId: "entity-0001",
        entityType: type,
        mutation: "create",
        operationId: "operation-0001",
      },
    ] as never);
    vi.mocked(delegate.findFirst).mockResolvedValue(null);
    expect(await pullSyncChanges({ userId: "user-1", limit: 5 })).toMatchObject(
      { changes: [{ data: null }] },
    );
    expect(
      JSON.stringify(vi.mocked(delegate.findFirst).mock.calls.at(-1)),
    ).toContain("user-1");
  },
);
