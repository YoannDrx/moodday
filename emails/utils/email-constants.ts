import { getServerUrl } from "@/lib/server-url";
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

// Get the base URL for email assets
export const getEmailBaseUrl = () => {
  let baseUrl = getServerUrl();
  // Email clients can't handle localhost URL
  if (baseUrl.startsWith("http://localhost")) {
    baseUrl = SiteConfig.prodUrl;
  }
  return baseUrl;
};

// Email URLs
export const EMAIL_URLS = {
  logo: () => `${getEmailBaseUrl()}${SiteConfig.appIcon}`,
  dashboard: () => `${getEmailBaseUrl()}/dashboard`,
  pricing: () => `${getEmailBaseUrl()}/pricing`,
  billing: () => `${getEmailBaseUrl()}/account/billing`,
  settings: () => `${getEmailBaseUrl()}/settings`,
  unsubscribe: () => `${getEmailBaseUrl()}/settings/notifications`,
} as const;

// Contact email
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_EMAIL_CONTACT ?? "hello@moodday.app";

// Site config re-export for convenience
export { SiteConfig };
