"use server";

import { sensitiveAuthAction } from "@/lib/actions/safe-actions";
import { ActionError } from "@/lib/errors/action-error";
import { assertFeatureAvailable } from "@/lib/features/availability";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { parseMooddayImport } from "./moodday-import";

const importInputSchema = z.object({
  format: z.enum(["json", "csv"]),
  content: z.string().min(1).max(1_000_000),
});

const prepare = async (
  userId: string,
  input: z.infer<typeof importInputSchema>,
) => {
  assertFeatureAvailable("accountImport");
  await enforceRateLimit({
    scope: "account-import",
    identifier: userId,
    max: 5,
    windowSeconds: 60 * 60,
  });
  try {
    return parseMooddayImport(input.format, input.content);
  } catch {
    throw new ActionError("Import file is invalid or unsupported");
  }
};

export const previewMooddayImport = sensitiveAuthAction
  .inputSchema(importInputSchema)
  .action(async ({ parsedInput, ctx: { user } }) => {
    const preview = await prepare(user.id, parsedInput);
    const existing = await prisma.moodEntry.findMany({
      where: {
        userId: user.id,
        clientOperationId: { in: preview.rows.map((row) => row.operationId) },
      },
      select: { clientOperationId: true },
    });
    const duplicateIds = new Set(existing.map((row) => row.clientOperationId));
    return {
      digest: preview.digest,
      formatVersion: preview.formatVersion,
      validRows: preview.rows.length,
      duplicateRows: preview.rows.filter((row) =>
        duplicateIds.has(row.operationId),
      ).length,
      errors: preview.errors,
      sample: preview.rows.slice(0, 10).map((row) => ({
        rowNumber: row.rowNumber,
        date: row.date,
        value: row.value,
        tags: row.tags,
      })),
    };
  });

export const commitMooddayImport = sensitiveAuthAction
  .inputSchema(
    importInputSchema.extend({ expectedDigest: z.string().length(64) }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    const preview = await prepare(user.id, parsedInput);
    if (preview.digest !== parsedInput.expectedDigest) {
      throw new ActionError("Import file changed after preview");
    }
    if (preview.errors.length > 0) {
      throw new ActionError("Fix all import errors before importing");
    }
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.moodEntry.createMany({
        data: preview.rows.map((row) => ({
          userId: user.id,
          clientOperationId: row.operationId,
          value: row.value,
          note: row.note ?? null,
          energy: row.energy ?? null,
          anxiety: row.anxiety ?? null,
          tags: row.tags,
          createdAt: new Date(row.date),
          updatedAt: new Date(row.date),
          syncStatus: "synced",
        })),
        skipDuplicates: true,
      });
      return {
        importedRows: result.count,
        skippedRows: preview.rows.length - result.count,
      };
    });
  });
