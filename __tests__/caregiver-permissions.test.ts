import { describe, expect, it } from "vitest";
import {
  canLeaveCaregiverRelationship,
  canManageCaregiverRelationship,
  CaregiverPermissionsSchema,
  getEffectiveCaregiverPermissions,
  hasCaregiverWritePermission,
  hasActiveCaregiverPermission,
  isCaregiverRelationshipReadOnly,
} from "../src/features/caregiver/permissions";

const activeRelationship = {
  patientId: "patient-1",
  caregiverId: "caregiver-1",
  status: "active",
  permissions: ["view_mood", "add_observations"],
};

describe("caregiver permissions", () => {
  it("accepts only supported permission identifiers", () => {
    expect(
      CaregiverPermissionsSchema.safeParse([
        "view_mood",
        "view_medications",
        "add_observations",
        "add_events",
      ]).success,
    ).toBe(true);
    expect(
      CaregiverPermissionsSchema.safeParse(["admin", "view_private_notes"])
        .success,
    ).toBe(false);
  });

  it("grants an explicitly assigned permission on an active relationship", () => {
    expect(
      hasActiveCaregiverPermission({
        relationship: activeRelationship,
        caregiverId: "caregiver-1",
        patientId: "patient-1",
        permission: "add_observations",
      }),
    ).toBe(true);
  });

  it("denies missing, revoked, and expired relationships", () => {
    for (const relationship of [
      null,
      { ...activeRelationship, revokedAt: new Date() },
      { ...activeRelationship, accessExpiresAt: new Date(Date.now() - 1) },
    ]) {
      expect(
        hasActiveCaregiverPermission({
          relationship,
          caregiverId: "caregiver-1",
          patientId: "patient-1",
          permission: "view_mood",
        }),
      ).toBe(false);
    }

    expect(
      hasActiveCaregiverPermission({
        relationship: {
          ...activeRelationship,
          accessExpiresAt: new Date(Date.now() + 60_000),
        },
        caregiverId: "caregiver-1",
        patientId: "patient-1",
        permission: "view_mood",
      }),
    ).toBe(true);
  });

  it.each([
    ["pending relationship", { ...activeRelationship, status: "pending" }],
    [
      "different caregiver",
      { ...activeRelationship, caregiverId: "caregiver-2" },
    ],
    ["different patient", { ...activeRelationship, patientId: "patient-2" }],
    [
      "missing permission",
      { ...activeRelationship, permissions: ["view_mood"] },
    ],
  ])("denies access for a %s", (_name, relationship) => {
    expect(
      hasActiveCaregiverPermission({
        relationship,
        caregiverId: "caregiver-1",
        patientId: "patient-1",
        permission: "add_observations",
      }),
    ).toBe(false);
  });

  it("allows only the patient to change permissions", () => {
    expect(
      canManageCaregiverRelationship({
        relationship: activeRelationship,
        userId: "patient-1",
      }),
    ).toBe(true);
    expect(
      canManageCaregiverRelationship({
        relationship: activeRelationship,
        userId: "caregiver-1",
      }),
    ).toBe(false);
  });

  it("allows either participant to leave and rejects a third party", () => {
    expect(
      canLeaveCaregiverRelationship({
        relationship: activeRelationship,
        userId: "patient-1",
      }),
    ).toBe(true);
    expect(
      canLeaveCaregiverRelationship({
        relationship: activeRelationship,
        userId: "caregiver-1",
      }),
    ).toBe(true);
    expect(
      canLeaveCaregiverRelationship({
        relationship: activeRelationship,
        userId: "stranger",
      }),
    ).toBe(false);
    expect(
      canLeaveCaregiverRelationship({ relationship: null, userId: "stranger" }),
    ).toBe(false);
    expect(
      canManageCaregiverRelationship({
        relationship: null,
        userId: "patient-1",
      }),
    ).toBe(false);
  });

  it("keeps the oldest relationships writable up to the plan limit", () => {
    const orderedRelationshipIds = ["oldest", "second", "newest"];

    expect(
      isCaregiverRelationshipReadOnly({
        relationshipId: "oldest",
        orderedRelationshipIds,
        caregiverLimit: 1,
      }),
    ).toBe(false);
    expect(
      isCaregiverRelationshipReadOnly({
        relationshipId: "second",
        orderedRelationshipIds,
        caregiverLimit: 1,
      }),
    ).toBe(true);
    expect(
      isCaregiverRelationshipReadOnly({
        relationshipId: "missing",
        orderedRelationshipIds,
        caregiverLimit: 0,
      }),
    ).toBe(false);
  });

  it("removes write capabilities but preserves view access after downgrade", () => {
    const permissions = [
      "view_mood",
      "view_medications",
      "add_observations",
      "add_events",
    ] as const;

    expect(hasCaregiverWritePermission([...permissions])).toBe(true);
    expect(getEffectiveCaregiverPermissions([...permissions], true)).toEqual([
      "view_mood",
      "view_medications",
    ]);
    expect(hasCaregiverWritePermission(["view_mood"])).toBe(false);
    expect(getEffectiveCaregiverPermissions([...permissions], false)).toEqual(
      permissions,
    );
  });
});
