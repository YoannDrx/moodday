import type { MooddayRole, TodayDto } from "@moodday/contracts";
import { getCommonMessages, type SupportedLocale } from "@moodday/i18n";

export type TabRoute = "index" | "cycle" | "duo" | "ally";

export type TabDefinition = { name: TabRoute; title: string; glyph: string };

/**
 * Four tabs for both sides of the duo. Only the wording changes: she owns
 * "Cycle" and "Pour moi", the partner reads "Son cycle" and follows "Allié".
 */
export const tabsForRole = (
  role: MooddayRole | null,
  locale: SupportedLocale = "fr",
): TabDefinition[] => {
  const { navigation } = getCommonMessages(locale);
  const supporter = role === "supporter";
  return [
    { name: "index", title: navigation.today, glyph: "☀" },
    {
      name: "cycle",
      title: supporter ? navigation.partnerCycle : navigation.cycle,
      glyph: "◐",
    },
    { name: "duo", title: navigation.duo, glyph: "♥" },
    {
      name: "ally",
      title: supporter ? navigation.ally : navigation.forMe,
      glyph: supporter ? "★" : "✿",
    },
  ];
};

export type NotificationRoute = "/" | "/duo";

/**
 * Push payloads carry the web path (`data.url`). Unknown or missing paths
 * open "Aujourd'hui"; nothing from the payload is ever used as a raw route.
 */
export const routeForNotificationUrl = (url: unknown): NotificationRoute =>
  url === "/duo" ? "/duo" : "/";

/** No role yet, or the short onboarding was left unfinished. */
export const needsOnboarding = (today: Pick<TodayDto, "role" | "onboarded">) =>
  today.role === null || !today.onboarded;
