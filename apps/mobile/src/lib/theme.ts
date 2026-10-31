import { color, darkColor } from "@moodday/design-tokens";
import { useColorScheme } from "react-native";

export type Palette = { readonly [Key in keyof typeof color]: string };

/** Ink stays dark on honey, mint, apricot and plum fills in both themes. */
export const inkOnFill = color.ink;

export const usePalette = (): Palette =>
  useColorScheme() === "dark" ? darkColor : color;
