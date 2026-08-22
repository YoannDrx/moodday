import { z } from "zod";

const cursorValueSchema = z.object({
  changedAt: z.iso.datetime(),
  id: z.string().min(1).max(128),
});

export type SyncCursorValue = z.infer<typeof cursorValueSchema>;

export const encodeSyncCursor = (value: SyncCursorValue) =>
  Buffer.from(JSON.stringify(value), "utf8").toString("base64url");

export const decodeSyncCursor = (cursor: string): SyncCursorValue | null => {
  try {
    const decoded: unknown = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    );
    const parsed = cursorValueSchema.safeParse(decoded);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};
