import { color } from "@moodday/design-tokens";
import type { ReactNode } from "react";
import { StyleSheet, Text, View, type ViewStyle } from "react-native";

export type BouyotteMood =
  | "ok"
  | "fragile"
  | "hard"
  | "very_hard"
  | "happy"
  | "sleepy"
  | "wink";

const bodyColor: Record<BouyotteMood, string> = {
  ok: color.mint,
  fragile: color.honey,
  hard: color.apricot,
  very_hard: color.plumSoft,
  happy: color.honey,
  sleepy: color.plumSoft,
  wink: color.apricot,
};

const ink = color.ink;

/**
 * Bouyotte, the Moodday hot-water bottle, drawn with plain views so the app
 * needs no SVG dependency. Coordinates follow the web SVG (viewBox 120×150).
 * Decorative by default; never shown on the help screen.
 */
export function Bouyotte({
  mood = "happy",
  size = 96,
  label,
  steam = false,
}: {
  mood?: BouyotteMood;
  /** Rendered height in points. */
  size?: number;
  label?: string;
  steam?: boolean;
}) {
  const s = size / 150;
  const box = (
    x: number,
    y: number,
    width: number,
    height: number,
    extra: ViewStyle = {},
  ): ViewStyle => ({
    position: "absolute",
    left: x * s,
    top: y * s,
    width: width * s,
    height: height * s,
    ...extra,
  });
  const stroke = Math.max(1.5, 3.5 * s);
  const dot = (
    cx: number,
    cy: number,
    r: number,
    fill: string = ink,
    opacity = 1,
  ) => (
    <View
      key={`${cx}-${cy}-${r}`}
      style={box(cx - r, cy - r, r * 2, r * 2, {
        borderRadius: r * s,
        backgroundColor: fill,
        opacity,
      })}
    />
  );
  // A "U" (smile, closed eye) or an upside-down "U" (wink, worried mouth).
  const arc = (
    x: number,
    y: number,
    width: number,
    height: number,
    up = false,
  ) => (
    <View
      key={`arc-${x}-${y}`}
      style={box(x, y, width, height, {
        borderColor: ink,
        borderLeftWidth: stroke,
        borderRightWidth: stroke,
        borderBottomWidth: up ? 0 : stroke,
        borderTopWidth: up ? stroke : 0,
        borderBottomLeftRadius: up ? 0 : (width * s) / 2,
        borderBottomRightRadius: up ? 0 : (width * s) / 2,
        borderTopLeftRadius: up ? (width * s) / 2 : 0,
        borderTopRightRadius: up ? (width * s) / 2 : 0,
      })}
    />
  );
  const bar = (x: number, y: number, width: number, rotate = 0) => (
    <View
      key={`bar-${x}-${y}`}
      style={box(x, y, width, 3.5, {
        borderRadius: stroke,
        backgroundColor: ink,
        transform: [{ rotate: `${rotate}deg` }],
      })}
    />
  );
  const cheeks = (y: number) => [
    dot(38, y, 5, color.apricot, 0.6),
    dot(82, y, 5, color.apricot, 0.6),
  ];

  const face: ReactNode[] = (() => {
    switch (mood) {
      case "ok":
      case "happy":
        return [
          dot(46, 72, 4.5),
          dot(74, 72, 4.5),
          arc(48, 82, 24, 9),
          ...(mood === "happy" ? cheeks(84) : []),
        ];
      case "fragile":
        return [dot(46, 73, 4), dot(74, 73, 4), bar(52, 86, 16), ...cheeks(83)];
      case "hard":
        return [
          bar(40, 63, 12, 20),
          bar(68, 63, 12, -20),
          dot(46, 74, 4),
          dot(74, 74, 4),
          arc(49, 86, 22, 7, true),
        ];
      case "very_hard":
      case "sleepy":
        return [
          arc(40, 72, 12, 6),
          arc(68, 72, 12, 6),
          arc(54, 86, 12, 5, true),
        ];
      case "wink":
        return [arc(40, 68, 12, 6, true), dot(74, 72, 4.5), arc(48, 82, 24, 9)];
    }
  })();

  return (
    <View
      accessible={Boolean(label)}
      accessibilityRole={label ? "image" : undefined}
      accessibilityLabel={label}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? "yes" : "no-hide-descendants"}
      style={{ width: 120 * s, height: size }}
    >
      {steam ? (
        <>
          {arc(44, 0, 8, 12)}
          {arc(68, 0, 8, 12)}
        </>
      ) : null}
      <View
        style={box(49, 16, 22, 14, {
          borderRadius: 4 * s,
          borderWidth: stroke,
          borderColor: ink,
          backgroundColor: color.plum,
        })}
      />
      <View
        style={box(44, 28, 32, 12, {
          borderWidth: stroke,
          borderColor: ink,
          backgroundColor: bodyColor[mood],
        })}
      />
      <View
        style={box(12, 38, 96, 106, {
          borderRadius: 32 * s,
          borderWidth: stroke,
          borderColor: ink,
          backgroundColor: bodyColor[mood],
          overflow: "hidden",
        })}
      >
        {/* knitted rib at the bottom of the cover */}
        <Text
          style={[
            styles.rib,
            { fontSize: 14 * s * 1.4, lineHeight: 14 * s * 1.4, top: 72 * s },
          ]}
        >
          {"︶︶︶︶︶︶︶︶"}
        </Text>
      </View>
      {face}
      {mood === "very_hard" ? (
        <Text
          style={[
            styles.heart,
            { left: 86 * s, top: 92 * s, fontSize: 16 * s, lineHeight: 18 * s },
          ]}
        >
          ♥
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rib: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: ink,
    opacity: 0.35,
  },
  heart: { position: "absolute", color: color.apricot, fontWeight: "800" },
});
