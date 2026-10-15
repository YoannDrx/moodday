import { safetyPlanWriteSchema } from "@moodday/contracts";
import { prisma } from "@/lib/prisma";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getSafetyPlan,
  saveSafetyPlan,
} from "@/features/v2/safety-plan/service";

const now = new Date("2026-08-23T18:00:00.000Z");
const storedPlan = {
  id: "safety-plan-1",
  userId: "user-1",
  warningSigns: ["Je m’isole"],
  copingStrategies: ["Marcher dix minutes"],
  safePlaces: ["Chez moi"],
  trustedContacts: [{ name: "Camille", detail: "06 00 00 00 00" }],
  professionalContacts: [],
  lastReviewedAt: now,
  createdAt: now,
  updatedAt: now,
};

describe("V2 personal safety plan", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects extra or malformed contact data at the API contract", () => {
    expect(
      safetyPlanWriteSchema.safeParse({
        warningSigns: [],
        copingStrategies: [],
        safePlaces: [],
        trustedContacts: [{ name: "Camille", detail: "06", shared: true }],
        professionalContacts: [],
        markReviewed: false,
      }).success,
    ).toBe(false);
  });

  it("reads only the plan owned by the authenticated user", async () => {
    vi.mocked(prisma.safetyPlan.findUnique).mockResolvedValue(
      storedPlan as never,
    );

    await expect(getSafetyPlan("user-1")).resolves.toMatchObject({
      id: storedPlan.id,
      trustedContacts: storedPlan.trustedContacts,
      lastReviewedAt: now.toISOString(),
    });
    expect(prisma.safetyPlan.findUnique).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });

  it("marks a review only after an explicit user save", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.mocked(prisma.safetyPlan.upsert).mockResolvedValue(storedPlan as never);

    await saveSafetyPlan("user-1", {
      warningSigns: storedPlan.warningSigns,
      copingStrategies: storedPlan.copingStrategies,
      safePlaces: storedPlan.safePlaces,
      trustedContacts: storedPlan.trustedContacts,
      professionalContacts: [],
      markReviewed: true,
    });

    expect(prisma.safetyPlan.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        create: expect.objectContaining({ lastReviewedAt: now }),
        update: expect.objectContaining({ lastReviewedAt: now }),
      }),
    );
    vi.useRealTimers();
  });
});
