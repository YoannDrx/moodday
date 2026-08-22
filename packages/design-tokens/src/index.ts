export const color = {
  canvas: "#F6F3EC",
  surface: "#FFFCF7",
  surfaceStrong: "#FFFFFF",
  ink: "#18312F",
  inkMuted: "#61716F",
  primary: "#1E7775",
  primaryDeep: "#155C5A",
  primarySoft: "#DDEDE9",
  sage: "#AFC9BC",
  apricot: "#F3C9A8",
  lavender: "#D9D2E9",
  border: "#DDE4DF",
  danger: "#A13F49",
  dangerSoft: "#F8E5E5",
  focus: "#166F9E",
} as const;

export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  small: 12,
  medium: 18,
  large: 28,
  pill: 999,
} as const;

export const motion = {
  quick: 120,
  standard: 220,
  deliberate: 360,
} as const;

export const typography = {
  display: "Fraunces, ui-serif, Georgia, serif",
  body: "Inter, ui-sans-serif, system-ui, sans-serif",
} as const;

export type MoodDayColor = keyof typeof color;
