import { SiteConfig } from "@/site-config";

// Moodday « Chaud devant » palette, kept email-safe (no CSS variables).
export const EMAIL_COLORS = {
  // Ink is the primary action colour; honey is the warm accent.
  primary: "#2B1B30",
  primaryHover: "#1E1322",
  accent: "#F2B84B",
  accentSoft: "#FDE9BF",
  mintSoft: "#DCF3E9",

  // Background colors
  background: "#FBF4EA",
  cardBackground: "#FFFAF3",

  // Text colors (contrast on cream ≥ 7:1)
  textPrimary: "#2B1B30",
  textSecondary: "#5E4C63",
  textMuted: "#6E5A75",

  // Accent colors
  success: "#2F7D5B",
  warning: "#9A5B00",
  error: "#B3261E",

  // Border colors
  border: "#2B1B30",
  divider: "#E7D9C6",
} as const;

// Email Typography
export const EMAIL_FONTS = {
  primary:
    "'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fallback: "Arial, sans-serif",
} as const;

// Email links always target the canonical production origin. Keeping this
// value independent from request headers and environment variables prevents a
// compromised deployment configuration from injecting links into messages.
const EMAIL_BASE_URL = "https://www.moodday.app" as const;

export const getEmailBaseUrl = () => EMAIL_BASE_URL;

// Email URLs
export const EMAIL_URLS = {
  logo: () => "https://www.moodday.app/icons/android-chrome-512x512.png",
  dashboard: () => "https://www.moodday.app/today",
  pricing: () => "https://www.moodday.app/pricing",
  billing: () => "https://www.moodday.app/account/billing",
  settings: () => "https://www.moodday.app/settings",
  unsubscribe: () => "https://www.moodday.app/settings/notifications",
  today: () => "https://www.moodday.app/today",
  duo: () => "https://www.moodday.app/duo",
  ally: (slug?: string) =>
    slug
      ? `https://www.moodday.app/ally/${slug}`
      : "https://www.moodday.app/ally",
  crisis: () => "https://www.moodday.app/crisis",
  lifecycleUnsubscribe: (token: string) =>
    `https://www.moodday.app/emails/unsubscribe?token=${encodeURIComponent(token)}`,
} as const;

// Contact email
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_EMAIL_CONTACT ?? "hello@moodday.app";

// Site config re-export for convenience
export { SiteConfig };
