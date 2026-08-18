/* eslint-disable no-await-in-loop -- each external deletion is claimed independently */
import { deleteManagedMooddayBlob } from "@/lib/files/vercel-blob-adapter";
import { deletePrivateRegulatoryExport } from "@/features/account/regulatory-export-delivery";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 6;

export const processExternalDeletionJobs = async (now = new Date()) => {
  const jobs = await prisma.externalDeletionJob.findMany({
    where: {
      status: { in: ["pending", "retry"] },
      attempts: { lt: MAX_ATTEMPTS },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
    },
    select: {
      id: true,
      resourceType: true,
      resourceLocator: true,
      attempts: true,
    },
    orderBy: { createdAt: "asc" },
    take: 25,
  });
  let succeeded = 0;
  let retried = 0;
  let dead = 0;

  for (const job of jobs) {
    const claimed = await prisma.externalDeletionJob.updateMany({
      where: {
        id: job.id,
        status: { in: ["pending", "retry"] },
        attempts: job.attempts,
      },
      data: { status: "processing", attempts: { increment: 1 } },
    });
    if (claimed.count !== 1) continue;

    try {
      if (job.resourceType === "vercel_blob_profile_image") {
        await deleteManagedMooddayBlob(job.resourceLocator);
      } else if (job.resourceType === "vercel_blob_regulatory_export") {
        if (!env.BLOB_READ_WRITE_TOKEN) {
          throw new Error("blob_not_configured");
        }
        await deletePrivateRegulatoryExport({
          resourceLocator: job.resourceLocator,
          blobToken: env.BLOB_READ_WRITE_TOKEN,
        });
      } else {
        throw new Error("unsupported_external_resource");
      }
      await prisma.externalDeletionJob.update({
        where: { id: job.id },
        data: {
          status: "succeeded",
          completedAt: new Date(),
          nextAttemptAt: null,
          lastErrorCode: null,
        },
      });
      succeeded += 1;
    } catch (error) {
      const attempt = job.attempts + 1;
      const isDead = attempt >= MAX_ATTEMPTS;
      await prisma.externalDeletionJob.update({
        where: { id: job.id },
        data: {
          status: isDead ? "dead" : "retry",
          nextAttemptAt: isDead
            ? null
            : new Date(
                Date.now() +
                  Math.min(5 * 60_000 * 2 ** (attempt - 1), 60 * 60_000),
              ),
          lastErrorCode: error instanceof Error ? error.name : "unknown_error",
        },
      });
      if (isDead) dead += 1;
      else retried += 1;
    }
  }

  return { claimed: jobs.length, succeeded, retried, dead };
};
