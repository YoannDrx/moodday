import { prisma } from "@/lib/prisma";
import { getToday } from "@/features/v2/today/service";
import { listCheckIns } from "@/features/v2/check-ins/service";
import { beforeEach, expect, it, vi } from "vitest";

vi.mock("@/features/v2/check-ins/service", () => ({ listCheckIns: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prisma.appointment.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.routine.findMany).mockResolvedValue([]);
  vi.mocked(prisma.sourceConnection.findMany).mockResolvedValue([]);
});

it("asks for the requested civil day, even when an older day synced later", async () => {
  const entry = { id: "today", localDate: "2026-09-06", depth: "presence" };
  vi.mocked(listCheckIns).mockResolvedValue({
    items: [entry],
    nextCursor: null,
  } as never);
  const result = await getToday({ userId: "patient", localDate: "2026-09-06" });
  expect(listCheckIns).toHaveBeenCalledWith({
    userId: "patient",
    localDate: "2026-09-06",
    limit: 1,
  });
  expect(result.latestCheckIn).toEqual(entry);
  expect(result.recommendedAction).toBe("none");
});

it("recommends an optional check-in when the requested day has no data", async () => {
  vi.mocked(listCheckIns).mockResolvedValue({ items: [], nextCursor: null });
  expect(
    await getToday({ userId: "patient", localDate: "2026-09-06" }),
  ).toMatchObject({ latestCheckIn: null, recommendedAction: "check_in" });
});
