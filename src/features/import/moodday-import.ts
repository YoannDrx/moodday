import { createHash } from "node:crypto";
import { z } from "zod";

const MAX_IMPORT_BYTES = 1_000_000;
const MAX_IMPORT_ROWS = 5_000;

const moodImportRowSchema = z.object({
  date: z.string().datetime(),
  value: z.number().int().min(0).max(10),
  note: z.string().max(5_000).nullable().optional(),
  energy: z.number().int().min(0).max(10).nullable().optional(),
  anxiety: z.number().int().min(0).max(10).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

const mooddayImportSchema = z.object({
  format: z.literal("moodday"),
  version: z.literal(2),
  moodEntries: z.array(moodImportRowSchema).max(MAX_IMPORT_ROWS),
});

export type ValidatedMoodImportRow = z.infer<typeof moodImportRowSchema> & {
  rowNumber: number;
  operationId: string;
};

export type MooddayImportPreview = {
  formatVersion: "2" | "csv-1";
  rows: ValidatedMoodImportRow[];
  errors: { rowNumber: number; code: string }[];
  digest: string;
};

const assertSize = (content: string) => {
  if (new TextEncoder().encode(content).byteLength > MAX_IMPORT_BYTES) {
    throw new Error("Import file exceeds 1 MB");
  }
};

const operationIdForRow = (row: unknown) =>
  `import:${createHash("sha256").update(JSON.stringify(row)).digest("hex").slice(0, 48)}`;

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value);
  return values;
};

const finalize = (
  formatVersion: MooddayImportPreview["formatVersion"],
  content: string,
  candidates: { rowNumber: number; value: unknown }[],
): MooddayImportPreview => {
  const rows: ValidatedMoodImportRow[] = [];
  const errors: MooddayImportPreview["errors"] = [];
  for (const candidate of candidates.slice(0, MAX_IMPORT_ROWS)) {
    const result = moodImportRowSchema.safeParse(candidate.value);
    if (!result.success) {
      errors.push({ rowNumber: candidate.rowNumber, code: "invalid_row" });
      continue;
    }
    rows.push({
      ...result.data,
      rowNumber: candidate.rowNumber,
      operationId: operationIdForRow(result.data),
    });
  }
  if (candidates.length > MAX_IMPORT_ROWS) {
    errors.push({ rowNumber: MAX_IMPORT_ROWS + 1, code: "too_many_rows" });
  }
  return {
    formatVersion,
    rows,
    errors,
    digest: createHash("sha256").update(content).digest("hex"),
  };
};

export const parseMooddayJsonImport = (content: string) => {
  assertSize(content);
  const parsed: unknown = JSON.parse(content);
  const result = mooddayImportSchema.safeParse(parsed);
  if (!result.success) throw new Error("Invalid Moodday JSON v2 file");
  return finalize(
    "2",
    content,
    result.data.moodEntries.map((value, index) => ({
      rowNumber: index + 1,
      value,
    })),
  );
};

export const parseMooddayCsvImport = (content: string) => {
  assertSize(content);
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean);
  if (lines.length === 0) throw new Error("Empty CSV file");
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const required = ["date", "value"];
  if (required.some((header) => !headers.includes(header))) {
    throw new Error("CSV requires date and value columns");
  }
  const candidates = lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line);
    const record: Partial<Record<string, string>> = Object.fromEntries(
      headers.map((header, headerIndex) => [header, cells[headerIndex] ?? ""]),
    );
    return {
      rowNumber: index + 2,
      value: {
        date: record.date,
        value: Number(record.value),
        note: record.note === undefined || record.note === "" ? null : record.note,
        energy:
          record.energy === undefined || record.energy === ""
            ? null
            : Number(record.energy),
        anxiety:
          record.anxiety === undefined || record.anxiety === ""
            ? null
            : Number(record.anxiety),
        tags: record.tags
          ? record.tags
              .split("|")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      },
    };
  });
  return finalize("csv-1", content, candidates);
};

export const parseMooddayImport = (format: "json" | "csv", content: string) =>
  format === "json"
    ? parseMooddayJsonImport(content)
    : parseMooddayCsvImport(content);
