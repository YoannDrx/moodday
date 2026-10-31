import { stateCatalog, type CheckInStateKey } from "./catalog";

// Notification rules for partner messages:
// - at most one check-in notification per partner and per day;
// - nothing between quiet hours (22:00 to 08:00 by default);
// - lock-screen text stays generic unless she enabled detailed previews.

const toMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const localTimeInTimeZone = (instant: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(instant);

export const isWithinQuietHours = (
  localTime: string,
  quietStart = "22:00",
  quietEnd = "08:00",
) => {
  const now = toMinutes(localTime);
  const start = toMinutes(quietStart);
  const end = toMinutes(quietEnd);
  if (start === end) return false;
  return start < end ? now >= start && now < end : now >= start || now < end;
};

/** Minutes to wait before quiet hours end; 0 when sending is allowed now. */
export const minutesUntilQuietHoursEnd = (
  localTime: string,
  quietStart = "22:00",
  quietEnd = "08:00",
) => {
  if (!isWithinQuietHours(localTime, quietStart, quietEnd)) return 0;
  const now = toMinutes(localTime);
  const end = toMinutes(quietEnd);
  return (end - now + 24 * 60) % (24 * 60);
};

export type PartnerNotificationKind = "check_in" | "gesture" | "link";

export type NotificationText = { title: string; body: string; url: string };

export const checkInNotification = (input: {
  ownerName: string;
  state: CheckInStateKey | null;
  firstNeedLabel: string | null;
  detailed: boolean;
}): NotificationText => {
  if (!input.detailed || !input.state) {
    return {
      title: "Moodday",
      body: `${input.ownerName} a partagé son point du jour.`,
      url: "/today",
    };
  }
  const state = stateCatalog[input.state].partnerLabel;
  return {
    title: `${input.ownerName} : ${state}`,
    body: input.firstNeedLabel
      ? `Elle aimerait : ${input.firstNeedLabel.toLowerCase()}.`
      : "Un petit geste ferait plaisir.",
    url: "/today",
  };
};

export const gestureNotification = (input: {
  senderName: string;
  gestureLabel: string;
  detailed: boolean;
}): NotificationText => ({
  title: "Moodday",
  body: input.detailed
    ? `${input.senderName} : « ${input.gestureLabel} »`
    : `${input.senderName} t'a envoyé un geste.`,
  url: "/today",
});
