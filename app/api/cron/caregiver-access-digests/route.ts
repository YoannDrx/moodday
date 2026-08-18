import { sendCaregiverAccessDigests } from "@/features/caregiver/access-digest";
import { validateCronRequest } from "@/lib/cron";
import { getFeatureAvailability } from "@/lib/features/availability";
import { runOperationalJob } from "@/lib/operations/job-runner";
import { route } from "@/lib/zod-route";

export const maxDuration = 300;

export const GET = route.handler(async (request) => {
  const unauthorized = validateCronRequest(request);
  if (unauthorized) return unauthorized;

  const availability = getFeatureAvailability("caregiverSharing");
  if (!availability.enabled) {
    return { ok: true, disabled: true, reason: availability.reason };
  }

  const job = await runOperationalJob({
    jobName: "caregiver-access-digests",
    intervalMs: 24 * 60 * 60 * 1000,
    task: async () => sendCaregiverAccessDigests(),
  });

  return job.skipped
    ? { ok: true, skipped: true }
    : { ok: true, ...job.result };
});
