import { inflateSync } from "node:zlib";

// Minimal text extraction for PDFs rendered by @react-pdf with the built-in
// Helvetica font: content streams are Flate-compressed and each text run is a
// WinAnsi hex or literal string inside a Tj/TJ operator. Runs of one TJ array
// are joined, separate operators are separated by a newline.
const decodeHex = (hex: string) =>
  Buffer.from(hex.replace(/\s+/g, ""), "hex").toString("latin1");

const decodeLiteral = (literal: string) =>
  literal.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_match, escaped: string) => {
    if (/^[0-7]+$/.test(escaped)) {
      return String.fromCharCode(parseInt(escaped, 8));
    }
    const named: Record<string, string> = {
      n: "\n",
      r: "\r",
      t: "\t",
      b: "\b",
      f: "\f",
    };
    return named[escaped] ?? escaped;
  });

const readStrings = (operand: string) =>
  [...operand.matchAll(/<[0-9a-fA-F\s]*>|\((?:\\.|[^\\)])*\)/g)]
    .map(([token]) =>
      token.startsWith("<")
        ? decodeHex(token.slice(1, -1))
        : decodeLiteral(token.slice(1, -1)),
    )
    .join("");

export const extractPdfText = (pdf: Buffer) => {
  const source = pdf.toString("latin1");
  const runs: string[] = [];
  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;

  for (const [, body] of source.matchAll(streamPattern)) {
    let content: string;
    try {
      content = inflateSync(Buffer.from(body, "latin1")).toString("latin1");
    } catch {
      continue;
    }
    for (const [, operand] of content.matchAll(
      /(\[(?:[^\]\\]|\\.)*\]|<[0-9a-fA-F\s]*>|\((?:\\.|[^\\)])*\))\s*T[Jj]/g,
    )) {
      runs.push(readStrings(operand));
    }
  }

  return runs.join("\n");
};
