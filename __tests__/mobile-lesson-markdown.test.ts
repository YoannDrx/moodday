import { describe, expect, it } from "vitest";
import {
  parseInline,
  parseLessonMarkdown,
} from "../apps/mobile/src/lib/lesson-markdown";

const lesson = `Certaines phrases font plus de dégâts qu'une semaine de crampes. Elles
**invalident** ce qu'elle ressent.

| À éviter | Plutôt |
| --- | --- |
| « Calme-toi. » | « Je vois que c'est dur. Je suis là. » |
| « Tu exagères. » | « Explique-moi, je veux comprendre. » |

- Une bouillotte
- Un **repas** simple

**Pourquoi ça marche :** tu passes du diagnostic à l'attention.`;

describe("native Ally lesson Markdown", () => {
  it("splits paragraphs, joining wrapped lines", () => {
    const [first] = parseLessonMarkdown(lesson);
    expect(first).toEqual({
      type: "paragraph",
      spans: [
        {
          text: "Certaines phrases font plus de dégâts qu'une semaine de crampes. Elles ",
          bold: false,
        },
        { text: "invalident", bold: true },
        { text: " ce qu'elle ressent.", bold: false },
      ],
    });
  });

  it("turns the table into rows keyed by the header, without the separator", () => {
    const table = parseLessonMarkdown(lesson).find(
      (block) => block.type === "table",
    );
    expect(table).toEqual({
      type: "table",
      header: ["À éviter", "Plutôt"],
      rows: [
        ["« Calme-toi. »", "« Je vois que c'est dur. Je suis là. »"],
        ["« Tu exagères. »", "« Explique-moi, je veux comprendre. »"],
      ],
    });
  });

  it("parses lists with inline bold, then the following paragraph", () => {
    const blocks = parseLessonMarkdown(lesson);
    expect(blocks.map((block) => block.type)).toEqual([
      "paragraph",
      "table",
      "list",
      "paragraph",
    ]);
    const list = blocks.find((block) => block.type === "list");
    expect(list?.type === "list" ? list.items[1] : null).toEqual([
      { text: "Un ", bold: false },
      { text: "repas", bold: true },
      { text: " simple", bold: false },
    ]);
  });

  it("keeps an unmatched bold marker as plain text", () => {
    expect(parseInline("deux ** étoiles")).toEqual([
      { text: "deux ", bold: false },
      { text: "** étoiles", bold: false },
    ]);
  });
});
