import { createRequire } from "node:module";
import type * as SQLite from "node:sqlite";
// Load the native SQLite builtin directly: Vite's happy-dom resolver on Node 22
// otherwise attempts to bundle this experimental, prefix-only builtin.
const { DatabaseSync } = createRequire(import.meta.url)(
  "node:sqlite",
) as typeof SQLite;
import { afterEach, beforeEach, expect, it } from "vitest";
import {
  reconcileMutableSnapshot,
  replaceUnchangedMutableSnapshot,
  type MutableSyncSnapshot,
} from "../apps/mobile/src/lib/mutable-sync-reconciliation";

let database: SQLite.DatabaseSync;
const sent: MutableSyncSnapshot = {
  entity_type: "user_draft",
  entity_id: "draft-1",
  context_key: "check_in:2026-09-07",
  base_version: null,
  payload: '{"note":"first"}',
  state: "dirty",
};
const canonical = {
  id: "draft-1",
  updatedAt: "2026-09-07T10:00:00Z",
  note: "first",
};
const adapter = {
  runAsync: async (sql: string, ...values: (string | number | null)[]) => ({
    changes: Number(database.prepare(sql).run(...values).changes),
  }),
};
const read = () => database.prepare("SELECT * FROM mutable_sync_state").get();

beforeEach(() => {
  database = new DatabaseSync(":memory:");
  database.exec(
    "CREATE TABLE mutable_sync_state (entity_type TEXT, context_key TEXT, entity_id TEXT, base_version TEXT, payload TEXT, state TEXT, updated_at TEXT, PRIMARY KEY(entity_type, context_key))",
  );
  database
    .prepare("INSERT INTO mutable_sync_state VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(
      sent.entity_type,
      sent.context_key,
      sent.entity_id,
      sent.base_version,
      sent.payload,
      sent.state,
      "before",
    );
});
afterEach(() => database.close());

it.each(["user_draft", "user_preferences"] as const)(
  "preserves a %s edited during refresh or discard",
  async (entity_type) => {
    database
      .prepare(
        "UPDATE mutable_sync_state SET entity_type = ?, state = 'synced'",
      )
      .run(entity_type);
    const before = { ...sent, entity_type, state: "synced" as const };
    database.exec(
      "UPDATE mutable_sync_state SET payload = 'new edit', state = 'dirty'",
    );
    await replaceUnchangedMutableSnapshot(adapter, before, before, {
      ...before,
      payload: "stale server",
    });
    await replaceUnchangedMutableSnapshot(adapter, before, before, null);
    expect(read()).toMatchObject({ payload: "new edit", state: "dirty" });
  },
);
it("does not overwrite a first local edit when the refresh started with an empty cache", async () => {
  await replaceUnchangedMutableSnapshot(adapter, sent, null, {
    ...sent,
    payload: "stale server",
    state: "synced",
  });
  expect(read()).toMatchObject({ payload: sent.payload, state: "dirty" });
});
it("removes an unchanged cached draft when the server reports deletion", async () => {
  await replaceUnchangedMutableSnapshot(adapter, sent, sent, null);
  expect(read()).toBeUndefined();
});
it("installs a remote snapshot into an empty cache", async () => {
  database.exec("DELETE FROM mutable_sync_state");
  await replaceUnchangedMutableSnapshot(adapter, sent, null, {
    ...sent,
    state: "synced",
  });
  expect(read()).toMatchObject({ payload: sent.payload, state: "synced" });
});

it("acknowledges an unchanged snapshot including a null base version", async () => {
  expect(await reconcileMutableSnapshot(adapter, sent, canonical)).toBe(
    "reconciled",
  );
  expect(read()).toMatchObject({
    state: "synced",
    base_version: canonical.updatedAt,
    payload: JSON.stringify(canonical),
  });
});
it("preserves an edit made while the upload was in flight and exposes a conflict", async () => {
  database
    .prepare("UPDATE mutable_sync_state SET payload = ?")
    .run('{"note":"newer private answer"}');
  expect(await reconcileMutableSnapshot(adapter, sent, canonical)).toBe(
    "changed_locally",
  );
  expect(read()).toMatchObject({
    state: "conflict",
    payload: '{"note":"newer private answer"}',
    base_version: null,
  });
});
it("does not acknowledge a newer base version", async () => {
  database
    .prepare("UPDATE mutable_sync_state SET base_version = ?")
    .run("a-newer-version");
  await reconcileMutableSnapshot(adapter, sent, canonical);
  expect(read()).toMatchObject({
    state: "conflict",
    base_version: "a-newer-version",
    payload: sent.payload,
  });
});
it("does not erase a draft recreated while a delete was in flight", async () => {
  const deleting = { ...sent, state: "delete_pending" as const };
  database
    .prepare("UPDATE mutable_sync_state SET entity_id = ?, payload = ?")
    .run("new-draft", "new content");
  await reconcileMutableSnapshot(adapter, deleting, null);
  expect(read()).toMatchObject({
    entity_id: "new-draft",
    state: "dirty",
    payload: "new content",
  });
});
it("removes only the unchanged draft selected for deletion", async () => {
  database.exec("UPDATE mutable_sync_state SET state = 'delete_pending'");
  expect(
    await reconcileMutableSnapshot(
      adapter,
      { ...sent, state: "delete_pending" },
      null,
    ),
  ).toBe("reconciled");
  expect(read()).toBeUndefined();
});
