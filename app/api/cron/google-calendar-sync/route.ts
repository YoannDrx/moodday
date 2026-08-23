import { synchronizeDueGoogleCalendars } from "@/features/v2/calendar/background-sync";
import { validateCronRequest } from "@/lib/cron";
import { getFeatureAvailability } from "@/lib/features/availability";
import { runOperationalJob } from "@/lib/operations/job-runner";
import { route } from "@/lib/zod-route";

export const maxDuration = 300;

export const GET = route.handler(async (request) => {
  const unauthorized = validateCronRequest(request);
  if (unauthorized) return unauthorized;

  const availability = getFeatureAvailability("googleCalendar");
  if (!availability.enabled) {
    return { ok: true, disabled: true, reason: availability.reason };
  }

  const job = await runOperationalJob({
    jobName: "google-calendar-sync",
    intervalMs: 15 * 60 * 1000,
    task: async () => synchronizeDueGoogleCalendars(),
  });

  return job.skipped
    ? { ok: true, skipped: true }
    : { ok: true, ...job.result };
});
