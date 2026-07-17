import { buildOfflineDiagnostic } from "@/features/pwa/offline-diagnostic";
import type { OfflineOperation } from "@/features/pwa/offline-store";
import { describe, expect, it } from "vitest";

describe("offline diagnostic", () => {
  it("summarizes queue health without exporting identifiers or payloads", () => {
    const operations = [
      {
        id: "mood:secret-operation-id",
        kind: "mood",
        payload: { note: "private journal note", value: 3 },
        status: "failed",
        retryCount: 2,
        createdAt: "2026-07-01T08:00:00.000Z",
        updatedAt: "2026-07-01T08:05:00.000Z",
        lastError: "private server error",
      },
      {
        id: "action:secret-operation-id",
        kind: "action",
        payload: { medicationId: "private-medication-id" },
        status: "pending",
        retryCount: 0,
        createdAt: "2026-07-02T08:00:00.000Z",
        updatedAt: "2026-07-02T08:00:00.000Z",
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
});
