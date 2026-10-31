// Moodday · direction « Chaud devant ». Shared by web (mirrored as CSS custom
// properties in app/globals.css) and the Expo app. State colours are always
// paired with an icon and a label; `crisis` is reserved for help actions.

export const color = {
  canvas: "#FBF4EA",
  surface: "#FFFAF3",
  surfaceStrong: "#FFFFFF",
  muted: "#F3E8D9",
  ink: "#2B1B30",
  inkMuted: "#5E4C63",
  primary: "#2B1B30",
  primaryDeep: "#1E1322",
  onPrimary: "#FBF4EA",
  honey: "#F2B84B",
  honeySoft: "#FDE9BF",
  mint: "#8FD3B8",
  mintSoft: "#DCF3E9",
  apricot: "#F39A62",
  apricotSoft: "#FDE0CC",
  plum: "#6B3C78",
  plumSoft: "#C9B1D6",
  border: "#2B1B30",
  danger: "#B3261E",
  dangerSoft: "#F8E1DF",
  focus: "#3D5A99",
} as const;

export const darkColor = {
  canvas: "#1E1322",
  surface: "#2A1D2F",
  surfaceStrong: "#33243A",
  muted: "#33243A",
  ink: "#FBF4EA",
  inkMuted: "#D9C9DE",
  primary: "#F5C566",
  primaryDeep: "#F2B84B",
  onPrimary: "#1E1322",
  honey: "#F5C566",
  honeySoft: "#4A3720",
  mint: "#8FD3B8",
  mintSoft: "#1F3D33",
  apricot: "#F5A877",
  apricotSoft: "#4A2C1C",
  plum: "#D7B9E6",
  plumSoft: "#5A3A67",
  border: "#6E5A75",
  danger: "#FF8A80",
  dangerSoft: "#3D1F23",
  focus: "#A9C1F5",
} as const satisfies Record<keyof typeof color, string>;

export const stateColor = {
  ok: color.mint,
  fragile: color.honey,
  hard: color.apricot,
  very_hard: color.plumSoft,
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
  small: 14,
  medium: 18,
  large: 28,
  pill: 999,
} as const;

/** The "sticker" look: thick ink outline and an offset shadow. */
export const sticker = {
  borderWidth: 2,
  shadowOffset: 4,
} as const;

export const motion = {
  quick: 120,
  standard: 220,
  deliberate: 360,
} as const;

export const typography = {
  display: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif",
  body: "Atkinson Hyperlegible, ui-sans-serif, system-ui, sans-serif",
} as const;

export type MoodDayColor = keyof typeof color;
