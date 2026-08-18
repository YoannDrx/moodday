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
  getSafetyPlan,
  saveSafetyPlan,
} from "@/features/safety-plan/safety-plan.action";

const user = { id: "safety-user", email: "patient@moodday.invalid" };
type Handler<T = unknown> = (args: {
  parsedInput: Record<string, unknown>;
  ctx: { user: typeof user };
}) => Promise<T>;
const invoke = async <T>(handler: unknown, parsedInput = {}) =>
  (handler as Handler<T>)({ parsedInput, ctx: { user } });

describe("safety plan actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads only the plan attached to the current user", async () => {
    vi.mocked(prisma.safetyPlan.findUnique).mockResolvedValue({
      userId: user.id,
    } as never);
    await invoke(getSafetyPlan);
    expect(prisma.safetyPlan.findUnique).toHaveBeenCalledWith({
      where: { userId: user.id },
    });
  });

  it("upserts an optional plan without inventing a review date", async () => {
    vi.mocked(prisma.safetyPlan.upsert).mockResolvedValue({
      userId: user.id,
    } as never);
    await invoke(saveSafetyPlan, {
      warningSigns: ["Isolement"],
      copingStrategies: ["Respirer"],
      safePlaces: ["Chez moi"],
      trustedContacts: [{ name: "Proche", detail: "Téléphone" }],
      professionalContacts: [],
      markReviewed: false,
    });

    expect(prisma.safetyPlan.upsert).toHaveBeenCalledWith({
      where: { userId: user.id },
      create: expect.objectContaining({
        userId: user.id,
        lastReviewedAt: null,
      }),
      update: expect.not.objectContaining({
        lastReviewedAt: expect.anything(),
      }),
    });
  });

  it("records an explicit review timestamp on create and update", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T20:00:00.000Z"));
    vi.mocked(prisma.safetyPlan.upsert).mockResolvedValue({
      userId: user.id,
    } as never);

    await invoke(saveSafetyPlan, {
      warningSigns: [],
      copingStrategies: [],
      safePlaces: [],
      trustedContacts: [],
      professionalContacts: [{ name: "Médecin", detail: "Cabinet" }],
      markReviewed: true,
    });

    const expected = new Date("2026-08-13T20:00:00.000Z");
    expect(prisma.safetyPlan.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ lastReviewedAt: expected }),
        update: expect.objectContaining({ lastReviewedAt: expected }),
      }),
    );
    vi.useRealTimers();
  });
});
