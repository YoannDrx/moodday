import "fake-indexeddb/auto";
import { afterEach, expect, it, vi } from "vitest";
import { saveMoodEntry } from "@/features/mood/mood.action";
import {
  queueMoodEntry,
  syncQueuedMoodEntries,
  getQueuedMoodCount,
} from "@/features/pwa/offline-queue";
import {
  clearOfflineOperations,
  listOfflineOperations,
  updateOfflineOperation,
} from "@/features/pwa/offline-store";
vi.mock("@/features/mood/mood.action", () => ({ saveMoodEntry: vi.fn() }));
afterEach(async () => {
  await clearOfflineOperations();
  vi.clearAllMocks();
});
it("coalesces concurrent syncs and leaves conflicts or delayed retries untouched", async () => {
  const ready = await queueMoodEntry("owner", { value: 5 });
  const conflict = await queueMoodEntry("owner", { value: 4 });
  const future = await queueMoodEntry("owner", { value: 3 });
  await updateOfflineOperation("owner", conflict.id, { status: "conflict" });
  await updateOfflineOperation("owner", future.id, {
    nextAttemptAt: new Date(Date.now() + 60000).toISOString(),
  });
  vi.mocked(saveMoodEntry).mockResolvedValue({ data: {} } as never);
  const [first, second] = await Promise.all([
    syncQueuedMoodEntries("owner"),
    syncQueuedMoodEntries("owner"),
  ]);
  expect(first).toEqual({ synced: 1, remaining: 2, conflicts: 1 });
  expect(second).toEqual(first);
  expect(saveMoodEntry).toHaveBeenCalledOnce();
  expect(saveMoodEntry).toHaveBeenCalledWith(
    expect.objectContaining({ operationId: ready.id }),
  );
  expect(await getQueuedMoodCount("owner")).toBe(2);
  expect(await syncQueuedMoodEntries("another-owner")).toEqual({
    synced: 0,
    remaining: 0,
    conflicts: 0,
  });
});
it.each([
  {
    result: { serverError: "network unavailable" },
    status: "failed",
    category: "network",
  },
  {
    result: { serverError: "version conflict" },
    status: "conflict",
    category: "conflict",
  },
  { result: null, status: "failed", category: "network" },
])(
  "retains the encrypted operation on $status and classifies its retry",
  async ({ result, status, category }) => {
    await queueMoodEntry("owner", { value: 2 });
    if (result) vi.mocked(saveMoodEntry).mockResolvedValue(result as never);
    else vi.mocked(saveMoodEntry).mockRejectedValue("unknown failure");
    expect(await syncQueuedMoodEntries("owner")).toMatchObject({
      synced: 0,
      remaining: 1,
    });
    const [saved] = await listOfflineOperations("owner", "mood");
    expect(saved).toMatchObject({
      status,
      errorCategory: category,
      retryCount: 1,
    });
    if (status === "failed")
      expect(new Date(saved.nextAttemptAt ?? "").getTime()).toBeGreaterThan(
        Date.now(),
      );
    else expect(saved.nextAttemptAt).toBeUndefined();
  },
);
