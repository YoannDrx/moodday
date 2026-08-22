import {
  createCheckInSchema,
  createRoutineOccurrenceSchema,
} from "@moodday/contracts";
import { describe, expect, it } from "vitest";
import {
  calculateSignedAssociation,
  projectPlusEntitlement,
  recommendCheckInDepth,
} from "@moodday/domain";

describe("Mood Day V2 domain", () => {
  it("accepts presence without a score and never invents scale values", () => {
    const result = createCheckInSchema.parse({
      operationId: "operation-presence-1",
      depth: "presence",
      localDate: "2026-08-21",
      timezone: "Europe/Paris",
    });

    expect(result).toMatchObject({ depth: "presence", contexts: [] });
    expect(result.valence).toBeUndefined();
    expect(result.activation).toBeUndefined();
  });

  it("requires the three core dimensions for quick and complete points", () => {
    const result = createCheckInSchema.safeParse({
      operationId: "operation-quick-1",
      depth: "quick",
      localDate: "2026-08-21",
      timezone: "Europe/Paris",
      valence: 4,
      activation: 6,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["irritability"]);
    }
  });

  it("requires an explicit completion time for a completed routine", () => {
    const valid = createRoutineOccurrenceSchema.parse({
      operationId: "operation-routine-occurrence-1",
      entityId: "routine-occurrence-1",
      routineId: "routine-1",
      localDate: "2026-08-22",
      timezone: "Europe/Paris",
      status: "completed",
      completedAt: "2026-08-22T18:00:00.000Z",
    });
    expect(valid.status).toBe("completed");

    const invalid = createRoutineOccurrenceSchema.safeParse({
      ...valid,
      completedAt: null,
    });
    expect(invalid.success).toBe(false);
  });

  it("recommends a neutral presence after an absence and a complete point near care changes", () => {
    expect(recommendCheckInDepth({ daysSinceLastCheckIn: 14 })).toBe(
      "presence",
    );
    expect(recommendCheckInDepth({ appointmentWithinDays: 2 })).toBe(
      "complete",
    );
    expect(recommendCheckInDepth({ medicationChangedRecently: true })).toBe(
      "complete",
    );
  });

  it("preserves negative association direction", () => {
    const association = calculateSignedAssociation([
      { x: 1, y: 10 },
      { x: 2, y: 8 },
      { x: 3, y: 6 },
      { x: 4, y: 4 },
      { x: 5, y: 2 },
    ]);

    expect(association?.direction).toBe("negative");
    expect(association?.coefficient).toBeLessThan(0);
    expect(association?.comparableDays).toBe(5);
  });

  it("projects a shared Plus entitlement and flags simultaneous purchases", () => {
    const calculatedAt = new Date("2026-08-22T00:00:00.000Z");
    const entitlement = projectPlusEntitlement(
      [
        {
          provider: "stripe",
          status: "active",
          currentPeriodEndsAt: new Date("2026-09-22T00:00:00.000Z"),
        },
        {
          provider: "app_store",
          status: "grace",
          currentPeriodEndsAt: new Date("2026-08-25T00:00:00.000Z"),
        },
        {
          provider: "play_store",
          status: "refunded",
          currentPeriodEndsAt: new Date("2026-09-30T00:00:00.000Z"),
        },
      ],
      calculatedAt,
    );

    expect(entitlement).toMatchObject({
      active: true,
      sourceProviders: ["stripe", "app_store"],
      validUntil: "2026-09-22T00:00:00.000Z",
      duplicateSubscription: true,
      manageWith: null,
    });
  });

  it("expires a source at its exact server boundary", () => {
    const calculatedAt = new Date("2026-08-22T00:00:00.000Z");
    const entitlement = projectPlusEntitlement(
      [
        {
          provider: "stripe",
          status: "active",
          currentPeriodEndsAt: calculatedAt,
        },
      ],
      calculatedAt,
    );

    expect(entitlement.active).toBe(false);
    expect(entitlement.sourceProviders).toEqual([]);
    expect(entitlement.manageWith).toBeNull();
  });
});
