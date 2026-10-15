import { z } from "zod";
import {
  getCaregiverAccessLog,
  getCaregiverActivity,
  getCaregiverDigestPreferences,
  getCaregiverSummary,
  getMyCaregivers,
  getMyPatients,
} from "@/features/caregiver/caregiver.action";
import { getCircleAvailabilityError } from "@/features/v2/circle/availability";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { readAuthRoute } from "@/lib/zod-route";

// Compatibility read facade: authorization and relationship checks stay in the
// existing services. No mutation can be selected through this endpoint.
const handler = withApiV2Route(
  readAuthRoute
    .query(
      z
        .object({
          resource: z.enum([
            "patients",
            "caregivers",
            "summary",
            "activity",
            "access",
            "preferences",
          ]),
          relationshipId: z.string().min(1).max(128).optional(),
        })
        .strict(),
    )
    .handler(async (request, { query }) => {
      const unavailable = getCircleAvailabilityError(request);
      if (unavailable) return unavailable;
      const scope = query.relationshipId
        ? {
            kind: "relationship" as const,
            relationshipId: query.relationshipId,
          }
        : { kind: "patient" as const };
      const readers = {
        patients: async () => getMyPatients(),
        caregivers: async () => getMyCaregivers(),
        summary: async () => getCaregiverSummary({ scope }),
        activity: async () =>
          getCaregiverActivity({ scope, days: 30, limit: 10 }),
        access: async () => getCaregiverAccessLog({ limit: 8 }),
        preferences: async () => getCaregiverDigestPreferences(),
      };
      const result = await readers[query.resource]();
      if (
        result.serverError ||
        result.validationErrors ||
        result.data == null
      ) {
        return apiError({
          code: "caregiver_read_unavailable",
          message: "common.actionFailed",
          recoverable: true,
          requestId: getRequestId(request),
          status: 403,
        });
      }
      return apiSuccess(result.data, getRequestId(request));
    }),
);

export const GET = async (...args: Parameters<typeof handler>) => {
  const response = await handler(...args);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
};
