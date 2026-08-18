import { SiteConfig } from "@/site-config";

// MoodDay Brand Colors
export const EMAIL_COLORS = {
  // Primary brand color - Teal MoodDay
  primary: "#2BA09F",
  primaryHover: "#249190",

  // Background colors
  background: "#F8F7F3", // Warm off-white
  cardBackground: "#FFFFFF",

  // Text colors
  textPrimary: "#1F2937", // Dark gray
  textSecondary: "#6B7280", // Medium gray
  textMuted: "#9CA3AF", // Light gray

  // Accent colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",

  // Border colors
  border: "#E5E7EB",
  divider: "#D1D5DB",
} as const;

// Email Typography
export const EMAIL_FONTS = {
  primary:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
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
  dashboard: () => "https://www.moodday.app/dashboard",
  pricing: () => "https://www.moodday.app/pricing",
  billing: () => "https://www.moodday.app/account/billing",
  settings: () => "https://www.moodday.app/settings",
  unsubscribe: () => "https://www.moodday.app/settings/notifications",
} as const;

// Contact email
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_EMAIL_CONTACT ?? "hello@moodday.app";

// Site config re-export for convenience
export { SiteConfig };
