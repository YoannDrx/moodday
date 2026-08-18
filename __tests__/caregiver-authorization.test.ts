import { authorizeCaregiverRelationship } from "@/features/caregiver/authorization";
import { describe, expect, it, vi } from "vitest";

const now = new Date("2026-08-13T12:00:00.000Z");
const relationship = {
  id: "relationship-1",
  patientId: "patient-1",
  caregiverId: "caregiver-1",
  status: "active",
  revokedAt: null,
  accessExpiresAt: null,
  permissions: ["view_mood", "add_observations"],
};

const clientFor = (currentRelationship: typeof relationship | null) => ({
  caregiverRelationship: {
    findUnique: vi.fn(async () => currentRelationship),
    findMany: vi.fn(async () => [{ id: "relationship-1" }]),
  },
  subscription: {
    findUnique: vi.fn(async () => null),
  },
});

describe("authorizeCaregiverRelationship", () => {
  it.each([
    ["missing", null],
    ["pending", { ...relationship, status: "pending" }],
    ["revoked", { ...relationship, revokedAt: now }],
    ["wrong caregiver", { ...relationship, caregiverId: "caregiver-2" }],
    [
      "expired",
      {
        ...relationship,
        accessExpiresAt: new Date("2026-08-13T11:59:59.000Z"),
      },
    ],
    ["missing permission", { ...relationship, permissions: ["view_mood"] }],
  ] as const)("rejects a %s relationship", async (_label, current) => {
    const client = clientFor(current as typeof relationship | null);

    await expect(
      authorizeCaregiverRelationship({
        relationshipId: "relationship-1",
        caregiverId: "caregiver-1",
        permission: "add_observations",
        client: client as never,
        now,
      }),
    ).rejects.toThrow("Caregiver access is unavailable");
    expect(client.subscription.findUnique).not.toHaveBeenCalled();
  });

  it("accepts any one permission from a server-defined permission set", async () => {
    const client = clientFor(relationship);

    await expect(
      authorizeCaregiverRelationship({
        relationshipId: "relationship-1",
        caregiverId: "caregiver-1",
        permission: ["view_medications", "view_mood"],
        client: client as never,
        now,
      }),
    ).resolves.toEqual({ relationship, readOnly: false });
  });

  it("marks relationships beyond the active plan limit as read-only", async () => {
    const second = { ...relationship, id: "relationship-2" };
    const client = clientFor(second);
    client.caregiverRelationship.findMany.mockResolvedValue([
      { id: "relationship-1" },
      { id: "relationship-2" },
    ]);

    await expect(
      authorizeCaregiverRelationship({
        relationshipId: "relationship-2",
        caregiverId: "caregiver-1",
        permission: "view_mood",
        client: client as never,
        now,
      }),
    ).resolves.toEqual({ relationship: second, readOnly: true });
  });

  it("blocks writes but preserves reads on a read-only relationship", async () => {
    const second = { ...relationship, id: "relationship-2" };
    const client = clientFor(second);
    client.caregiverRelationship.findMany.mockResolvedValue([
      { id: "relationship-1" },
      { id: "relationship-2" },
    ]);

    await expect(
      authorizeCaregiverRelationship({
        relationshipId: "relationship-2",
        caregiverId: "caregiver-1",
        permission: "add_observations",
        enforceWriteAccess: true,
        client: client as never,
        now,
      }),
    ).rejects.toThrow("Caregiver relationship is read-only");

    await expect(
      authorizeCaregiverRelationship({
        relationshipId: "relationship-2",
        caregiverId: "caregiver-1",
        permission: "view_mood",
        enforceWriteAccess: true,
        client: client as never,
        now,
      }),
    ).resolves.toEqual({ relationship: second, readOnly: true });
  });
});
