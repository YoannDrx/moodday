import { describe, expect, it, vi } from "vitest";

import {
  buildCaregiverAccessKey,
  CAREGIVER_ACCESS_RESOURCES,
  getCaregiverAccessBucket,
  recordCaregiverSharedSpaceAccess,
} from "../src/features/caregiver/access-log";

describe("caregiver access log", () => {
  it("groups repeated reads in a fifteen-minute UTC window", () => {
    expect(
      getCaregiverAccessBucket(new Date("2026-07-17T10:14:59.999Z")),
    ).toEqual(new Date("2026-07-17T10:00:00.000Z"));
    expect(
      getCaregiverAccessBucket(new Date("2026-07-17T10:15:00.000Z")),
    ).toEqual(new Date("2026-07-17T10:15:00.000Z"));
  });

  it("builds a deterministic key without patient or medical content", () => {
    const key = buildCaregiverAccessKey({
      relationshipId: "relationship-1",
      resource: CAREGIVER_ACCESS_RESOURCES.sharedSpace,
      now: new Date("2026-07-17T10:11:00.000Z"),
    });

    expect(key).toBe("relationship-1:shared_space:2026-07-17T10:00:00.000Z");
  });

  it("writes one content-free row per active patient", async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 2 });
    const now = new Date("2026-07-17T10:11:00.000Z");

    await expect(
      recordCaregiverSharedSpaceAccess({
        client: {
          caregiverAccessLog: { createMany } as never,
        },
        caregiverId: "caregiver-1",
        relationships: [
          { id: "relationship-1", patientId: "patient-1" },
          { id: "relationship-2", patientId: "patient-2" },
        ],
        now,
      }),
    ).resolves.toBe(2);

    expect(createMany).toHaveBeenCalledWith({
      data: [
        {
          patientId: "patient-1",
          caregiverId: "caregiver-1",
          relationshipId: "relationship-1",
          resource: "shared_space",
          accessKey: "relationship-1:shared_space:2026-07-17T10:00:00.000Z",
          accessedAt: now,
        },
        {
          patientId: "patient-2",
          caregiverId: "caregiver-1",
          relationshipId: "relationship-2",
          resource: "shared_space",
          accessKey: "relationship-2:shared_space:2026-07-17T10:00:00.000Z",
          accessedAt: now,
        },
      ],
      skipDuplicates: true,
    });
  });

  it("does not touch the database when no relationship is active", async () => {
    const createMany = vi.fn();

    await expect(
      recordCaregiverSharedSpaceAccess({
        client: {
          caregiverAccessLog: { createMany } as never,
        },
        caregiverId: "caregiver-1",
        relationships: [],
      }),
    ).resolves.toBe(0);
    expect(createMany).not.toHaveBeenCalled();
  });
});
