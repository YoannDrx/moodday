export type MutableSyncSnapshot = {
  entity_type: "user_draft" | "user_preferences";
  entity_id: string;
  context_key: string;
  base_version: string | null;
  payload: string;
  state: "synced" | "dirty" | "delete_pending" | "conflict";
};

type LocalWriter = {
  runAsync: (
    sql: string,
    ...values: (string | number | null)[]
  ) => Promise<{ changes: number }>;
};

/** Refresh/discard may only replace the state observed before awaiting I/O. */
export async function replaceUnchangedMutableSnapshot(
  database: LocalWriter,
  key: Pick<MutableSyncSnapshot, "entity_type" | "context_key">,
  before: MutableSyncSnapshot | null,
  after: MutableSyncSnapshot | null,
) {
  const now = new Date().toISOString();
  if (!before) {
    if (!after) return;
    await database.runAsync(
      `INSERT INTO mutable_sync_state (entity_type, context_key, entity_id, base_version, payload, state, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(entity_type, context_key) DO NOTHING`,
      key.entity_type,
      key.context_key,
      after.entity_id,
      after.base_version,
      after.payload,
      after.state,
      now,
    );
    return;
  }
  const predicate =
    "entity_type = ? AND context_key = ? AND entity_id = ? AND base_version IS ? AND payload = ? AND state = ?";
  const expected = [
    key.entity_type,
    key.context_key,
    before.entity_id,
    before.base_version,
    before.payload,
    before.state,
  ];
  if (after) {
    await database.runAsync(
      `UPDATE mutable_sync_state SET entity_id = ?, base_version = ?, payload = ?, state = ?, updated_at = ? WHERE ${predicate}`,
      after.entity_id,
      after.base_version,
      after.payload,
      after.state,
      now,
      ...expected,
    );
  } else {
    await database.runAsync(
      `DELETE FROM mutable_sync_state WHERE ${predicate}`,
      ...expected,
    );
  }
}

/** A late network acknowledgement may only replace the exact snapshot sent. */
export async function reconcileMutableSnapshot(
  database: LocalWriter,
  sent: MutableSyncSnapshot,
  canonical: { id: string; updatedAt: string } | null,
) {
  const expected = [
    sent.entity_type,
    sent.context_key,
    sent.entity_id,
    sent.base_version,
    sent.state,
    sent.payload,
  ];
  const predicate =
    "entity_type = ? AND context_key = ? AND entity_id = ? AND base_version IS ? AND state = ? AND payload = ?";
  const now = new Date().toISOString();
  const result = canonical
    ? await database.runAsync(
        `UPDATE mutable_sync_state SET entity_id = ?, base_version = ?, payload = ?, state = 'synced', updated_at = ? WHERE ${predicate}`,
        canonical.id,
        canonical.updatedAt,
        JSON.stringify(canonical),
        now,
        ...expected,
      )
    : await database.runAsync(
        `DELETE FROM mutable_sync_state WHERE ${predicate}`,
        ...expected,
      );
  if (result.changes > 0) return "reconciled" as const;
  // Preserve the newer payload and require explicit conflict resolution. Do not
  // silently rebase it on a server version the user has never reviewed.
  await database.runAsync(
    "UPDATE mutable_sync_state SET state = 'conflict', updated_at = ? WHERE entity_type = ? AND context_key = ? AND entity_id = ?",
    now,
    sent.entity_type,
    sent.context_key,
    sent.entity_id,
  );
  return "changed_locally" as const;
}
