import { radius, space, sticker } from "@moodday/design-tokens";
import { StyleSheet, View } from "react-native";
import {
  parseInline,
  parseLessonMarkdown,
  type Span,
} from "../lib/lesson-markdown";
import { usePalette } from "../lib/theme";
import { Txt } from "./ui";

function Inline({ spans }: { spans: readonly Span[] }) {
  return (
    <Txt>
      {spans.map((span, index) => (
        <Txt key={index} style={span.bold ? styles.bold : undefined}>
          {span.text}
        </Txt>
      ))}
    </Txt>
  );
}

/** Renders the lesson body; the table becomes stacked rows, readable on phones. */
export function LessonBody({ source }: { source: string }) {
  const palette = usePalette();
  return (
    <View style={styles.body}>
      {parseLessonMarkdown(source).map((block, index) => {
        if (block.type === "paragraph")
          return <Inline key={index} spans={block.spans} />;
        if (block.type === "list")
          return (
            <View key={index} style={styles.list}>
              {block.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.item}>
                  <Txt
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                  >
                    •
                  </Txt>
                  <View style={styles.flex}>
                    <Inline spans={item} />
                  </View>
                </View>
              ))}
            </View>
          );
        return (
          <View key={index} style={styles.list}>
            {block.rows.map((row, rowIndex) => (
              <View
                key={rowIndex}
                style={[
                  styles.row,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.canvas,
                  },
                ]}
              >
                {row.map((cell, cellIndex) => (
                  <Txt key={cellIndex}>
                    <Txt style={styles.bold}>
                      {block.header[cellIndex] ?? ""}
                      {block.header[cellIndex] ? " : " : ""}
                    </Txt>
                    <Inline spans={parseInline(cell)} />
                  </Txt>
                ))}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: space[4] },
  list: { gap: space[2] },
  item: { flexDirection: "row", gap: space[2] },
  flex: { flex: 1 },
  row: {
    gap: space[1],
    padding: space[3],
    borderWidth: sticker.borderWidth,
    borderRadius: radius.medium,
  },
  bold: { fontWeight: "800" },
});
