import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
type JournalEntry = {
  id: string;
  source: "legacy" | "check_in";
  localDate: string;
  depth: string | null;
  value: number | null;
  energy: number | null;
  anxiety: number | null;
  tags: string[];
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function searchJournalEntries(
  userId: string,
  timezone: string,
  filtersInput: {
    query: string;
    tags: string[];
    moodMin?: number;
    moodMax?: number;
    start?: string;
    end?: string;
    page: number;
    pageSize: number;
  },
) {
  // A single bounded UNION keeps pagination stable across both generations.
  // Each branch scopes ownership before filtering or pagination.
  const filters = [Prisma.sql`TRUE`];
  if (filtersInput.query)
    filters.push(
      Prisma.sql`strpos(lower(note), lower(${filtersInput.query})) > 0`,
    );
  if (filtersInput.tags.length)
    filters.push(
      Prisma.sql`tags @> ARRAY[${Prisma.join(filtersInput.tags)}]::text[]`,
    );
  if (filtersInput.moodMin !== undefined)
    filters.push(Prisma.sql`value >= ${filtersInput.moodMin}`);
  if (filtersInput.moodMax !== undefined)
    filters.push(Prisma.sql`value <= ${filtersInput.moodMax}`);
  if (filtersInput.start)
    filters.push(Prisma.sql`"localDate" >= ${filtersInput.start}`);
  if (filtersInput.end)
    filters.push(Prisma.sql`"localDate" <= ${filtersInput.end}`);
  const entries = await prisma.$queryRaw<JournalEntry[]>(Prisma.sql`
      SELECT * FROM (
        SELECT id, 'legacy'::text AS source,
          to_char("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${timezone}, 'YYYY-MM-DD') AS "localDate",
          NULL::text AS depth, value, energy, anxiety, tags, note, "createdAt", "updatedAt"
        FROM mood_entry WHERE "userId" = ${userId}
        UNION ALL
        SELECT id, 'check_in'::text AS source, "localDate", depth::text,
          valence AS value, activation AS energy, anxiety, contexts AS tags, note, "createdAt", "updatedAt"
        FROM v2_check_in WHERE "userId" = ${userId}
      ) journal WHERE ${Prisma.join(filters, " AND ")}
      ORDER BY "localDate" DESC, "createdAt" DESC, source DESC, id DESC
      LIMIT ${filtersInput.pageSize} OFFSET ${(filtersInput.page - 1) * filtersInput.pageSize}
    `);
  return entries;
}
