// Minimal Markdown for Ally lessons: paragraphs, **bold**, "- " lists and a
// two-column table. Anything else is shown as plain text, never as markup.

export type Span = { text: string; bold: boolean };

export type LessonBlock =
  | { type: "paragraph"; spans: Span[] }
  | { type: "list"; items: Span[][] }
  | { type: "table"; header: string[]; rows: string[][] };

export const parseInline = (text: string): Span[] => {
  const spans: Span[] = [];
  const parts = text.split("**");
  // An odd number of "**" leaves the last marker unmatched: keep it literal.
  const balanced = parts.length % 2 === 1;
  parts.forEach((part, index) => {
    const bold = balanced && index % 2 === 1;
    const value = !balanced && index > 0 ? `**${part}` : part;
    if (value) spans.push({ text: value, bold });
  });
  return spans;
};

const tableCells = (line: string) =>
  line
    .trim()
    .replace(/^\|/u, "")
    .replace(/\|$/u, "")
    .split("|")
    .map((cell) => cell.trim());

const isTableSeparator = (line: string) =>
  /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/u.test(line.trim());

export const parseLessonMarkdown = (source: string): LessonBlock[] => {
  const blocks: LessonBlock[] = [];
  const lines = source.replace(/\r\n?/gu, "\n").split("\n");
  const open: {
    paragraph: string[];
    list: Span[][] | null;
    table: { header: string[]; rows: string[][] } | null;
  } = { paragraph: [], list: null, table: null };

  const flush = () => {
    if (open.paragraph.length > 0)
      blocks.push({
        type: "paragraph",
        spans: parseInline(open.paragraph.join(" ")),
      });
    if (open.list) blocks.push({ type: "list", items: open.list });
    if (open.table) blocks.push({ type: "table", ...open.table });
    open.paragraph = [];
    open.list = null;
    open.table = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("|")) {
      if (!open.table) {
        flush();
        open.table = { header: tableCells(line), rows: [] };
      } else if (!isTableSeparator(line)) {
        open.table.rows.push(tableCells(line));
      }
      continue;
    }
    const item = /^[-*]\s+(.*)$/u.exec(line);
    if (item) {
      if (!open.list) {
        flush();
        open.list = [];
      }
      open.list.push(parseInline(item[1] ?? ""));
      continue;
    }
    if (open.list || open.table) flush();
    open.paragraph.push(line);
  }
  flush();
  return blocks;
};
