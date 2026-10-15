import type { CreateCheckInInput, SyncPushOperation } from "@moodday/contracts";
import type { Prisma } from "@prisma/client";
import { createPayloadDigest } from "./digest";

export class OperationConflictError extends Error {
  constructor() {
    super("Cet identifiant a déjà été utilisé pour un autre contenu.");
    this.name = "OperationConflictError";
  }
}

export const lockSyncOperation = async (
  transaction: Prisma.TransactionClient,
  userId: string,
  operationId: string,
) =>
  transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify(["sync-operation", userId, operationId])}, 0))`;

export const checkInDigest = (input: Omit<CreateCheckInInput, "operationId">) =>
  createPayloadDigest({
    depth: input.depth,
    localDate: input.localDate,
    timezone: input.timezone,
    valence: input.valence ?? null,
    activation: input.activation ?? null,
    irritability: input.irritability ?? null,
    anxiety: input.anxiety ?? null,
    contexts: input.contexts,
    note: input.note ?? null,
  });

export const syncOperationDigest = (operation: SyncPushOperation) =>
  `v2:${createPayloadDigest({
    entityId: operation.entityId,
    entityType: operation.entityType,
    mutation: operation.mutation,
    baseVersion: operation.baseVersion ?? null,
    payload: operation.payload,
  })}`;

/** Older direct endpoints included transport identifiers in their receipt hash. */
export function matchesLegacyOperationDigest(
  digest: string | null,
  operation: SyncPushOperation,
) {
  if (!digest) return false;
  if (digest.startsWith("v2:")) return false;
  if (digest === createPayloadDigest(operation.payload)) return true;
  if (
    !operation.payload ||
    typeof operation.payload !== "object" ||
    Array.isArray(operation.payload)
  )
    return false;
  const payload = { ...operation.payload, operationId: operation.operationId };
  const idField =
    operation.entityType === "appointment_question"
      ? "questionId"
      : operation.entityType === "appointment_event"
        ? "eventId"
        : operation.entityType === "appointment_decision"
          ? "decisionId"
          : "entityId";
  return (
    digest === createPayloadDigest(payload) ||
    digest ===
      createPayloadDigest({ ...payload, [idField]: operation.entityId })
  );
}
