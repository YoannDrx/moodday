import { buildOfflineDiagnostic } from "@/features/pwa/offline-diagnostic";
import type { OfflineOperation } from "@/features/pwa/offline-store";
import { describe, expect, it } from "vitest";

describe("offline diagnostic", () => {
  it("summarizes queue health without exporting identifiers or payloads", () => {
    const operations = [
      {
        id: "mood:secret-operation-id",
        ownerId: "user-secret",
        schemaVersion: 2,
        kind: "mood",
        payload: { note: "private journal note", value: 3 },
        status: "failed",
        retryCount: 2,
        createdAt: "2026-07-01T08:00:00.000Z",
        updatedAt: "2026-07-01T08:05:00.000Z",
        localDateAtCreation: "2026-07-01",
        timeZoneAtCreation: "Europe/Paris",
        lastError: "private server error",
      },
      {
        id: "action:secret-operation-id",
        ownerId: "user-secret",
        schemaVersion: 2,
        kind: "action",
        payload: { medicationId: "private-medication-id" },
        status: "pending",
        retryCount: 0,
        createdAt: "2026-07-02T08:00:00.000Z",
        updatedAt: "2026-07-02T08:00:00.000Z",
        localDateAtCreation: "2026-07-02",
        timeZoneAtCreation: "Europe/Paris",
      },
    ] satisfies OfflineOperation[];

    const diagnostic = buildOfflineDiagnostic({
      operations,
      generatedAt: new Date("2026-07-16T12:00:00.000Z"),
      online: false,
      storage: { usage: 250, quota: 1_000 },
    });
    const serialized = JSON.stringify(diagnostic);

    expect(diagnostic).toMatchObject({
      connection: "offline",
      queue: {
        operationCount: 2,
        byKind: { mood: 1, action: 1 },
        byStatus: { failed: 1, pending: 1 },
        retryCount: { total: 2, maximum: 2 },
      },
      storage: { usageBytes: 250, quotaBytes: 1_000, usagePercent: 25 },
    });
    expect(serialized).not.toContain("secret-operation-id");
    expect(serialized).not.toContain("private journal note");
    expect(serialized).not.toContain("private-medication-id");
    expect(serialized).not.toContain("private server error");
  });

  it("reports an empty online queue without inventing storage values", () => {
    const now = new Date("2026-08-18T14:00:00.000Z");
    const diagnostic = buildOfflineDiagnostic({
      operations: [],
      generatedAt: now,
      online: true,
    });

    expect(diagnostic).toMatchObject({
      generatedAt: now.toISOString(),
      connection: "online",
      queue: {
        operationCount: 0,
        byKind: {},
        byStatus: {},
        retryCount: { total: 0, maximum: 0 },
        oldestCreatedAt: null,
        newestCreatedAt: null,
      },
      storage: {
        usageBytes: null,
        quotaBytes: null,
        usagePercent: null,
      },
    });
  });

  it.each([
    [{ usage: 0, quota: 0 }, null],
    [{ usage: 50 }, null],
    [{ quota: 100 }, null],
    [{ usage: 1, quota: 3 }, 33.33],
  ] as const)(
    "handles incomplete and bounded storage estimates: %j",
    (storage, usagePercent) => {
      const diagnostic = buildOfflineDiagnostic({
        operations: [],
        online: true,
        storage,
      });
      expect(diagnostic.storage.usagePercent).toBe(usagePercent);
      expect(new Date(diagnostic.generatedAt).toString()).not.toBe(
        "Invalid Date",
      );
    },
  );
});
