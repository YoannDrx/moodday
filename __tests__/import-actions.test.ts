import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";

const actionClient = vi.hoisted(() => {
  const client = { inputSchema: vi.fn(), action: vi.fn() };
  client.inputSchema.mockReturnValue(client);
  client.action.mockImplementation((handler) => handler);
  return client;
});
const mocks = vi.hoisted(() => ({
  assertFeatureAvailable: vi.fn(),
  enforceRateLimit: vi.fn(),
  parseMooddayImport: vi.fn(),
}));

vi.mock("@/lib/actions/safe-actions", () => ({
  sensitiveAuthAction: actionClient,
}));
vi.mock("@/lib/features/availability", () => ({
  assertFeatureAvailable: mocks.assertFeatureAvailable,
}));
vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mocks.enforceRateLimit,
}));
vi.mock("@/features/import/moodday-import", () => ({
  parseMooddayImport: mocks.parseMooddayImport,
}));

import {
  commitMooddayImport,
  previewMooddayImport,
} from "@/features/import/import.action";

const user = { id: "import-user", email: "patient@moodday.invalid" };
type Handler<T = unknown> = (args: {
  parsedInput: Record<string, unknown>;
  ctx: { user: typeof user };
}) => Promise<T>;
const invoke = async <T>(handler: unknown, parsedInput = {}) =>
  (handler as Handler<T>)({ parsedInput, ctx: { user } });

const rows = Array.from({ length: 12 }, (_, index) => ({
  rowNumber: index + 1,
  operationId: `operation-${index + 1}`,
  value: index === 0 ? 0 : 5,
  note: index === 1 ? "Note" : undefined,
  energy: index === 2 ? 0 : undefined,
  anxiety: index === 3 ? 2 : undefined,
  tags: index === 4 ? ["protective"] : [],
  date: `2026-08-${String(index + 1).padStart(2, "0")}T08:00:00.000Z`,
}));

const parsed = {
  digest: "a".repeat(64),
  formatVersion: "2.0",
  rows,
  errors: [{ rowNumber: 13, message: "Synthetic invalid row" }],
};

describe("Moodday import actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.parseMooddayImport.mockReturnValue(parsed);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      (callback as (transaction: typeof prisma) => Promise<unknown>)(prisma),
    );
  });

  it("previews a bounded sample and detects already imported operation IDs", async () => {
    vi.mocked(prisma.moodEntry.findMany).mockResolvedValue([
      { clientOperationId: "operation-2" },
      { clientOperationId: "operation-9" },
    ] as never);

    const result = await invoke<{
      validRows: number;
      duplicateRows: number;
      sample: unknown[];
    }>(previewMooddayImport, { format: "json", content: "{}" });

    expect(result).toMatchObject({ validRows: 12, duplicateRows: 2 });
    expect(result.sample).toHaveLength(10);
    expect(result.sample[0]).toMatchObject({ value: 0 });
    expect(mocks.assertFeatureAvailable).toHaveBeenCalledWith("accountImport");
    expect(mocks.enforceRateLimit).toHaveBeenCalledWith({
      scope: "account-import",
      identifier: user.id,
      max: 5,
      windowSeconds: 3600,
    });
  });

  it("maps parser failures to a stable product error", async () => {
    mocks.parseMooddayImport.mockImplementation(() => {
      throw new Error("parser internals");
    });
    await expect(
      invoke(previewMooddayImport, { format: "csv", content: "bad" }),
    ).rejects.toThrow("Import file is invalid or unsupported");
  });

  it("refuses changed content and previews containing any row error", async () => {
    await expect(
      invoke(commitMooddayImport, {
        format: "json",
        content: "{}",
        expectedDigest: "b".repeat(64),
      }),
    ).rejects.toThrow("Import file changed after preview");

    await expect(
      invoke(commitMooddayImport, {
        format: "json",
        content: "{}",
        expectedDigest: parsed.digest,
      }),
    ).rejects.toThrow("Fix all import errors before importing");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("commits valid rows transactionally and reports database duplicates", async () => {
    mocks.parseMooddayImport.mockReturnValue({ ...parsed, errors: [] });
    vi.mocked(prisma.moodEntry.createMany).mockResolvedValue({ count: 10 });

    await expect(
      invoke(commitMooddayImport, {
        format: "json",
        content: "{}",
        expectedDigest: parsed.digest,
      }),
    ).resolves.toEqual({ importedRows: 10, skippedRows: 2 });
    expect(prisma.moodEntry.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          userId: user.id,
          clientOperationId: "operation-1",
          value: 0,
          note: null,
          syncStatus: "synced",
        }),
        expect.objectContaining({
          clientOperationId: "operation-2",
          note: "Note",
        }),
        expect.objectContaining({
          clientOperationId: "operation-3",
          energy: 0,
        }),
      ]),
      skipDuplicates: true,
    });
  });
});
