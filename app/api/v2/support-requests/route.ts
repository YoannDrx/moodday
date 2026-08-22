import { createSupportRequestSchema } from "@moodday/contracts";
import { getCircleAvailabilityError } from "@/features/v2/circle/availability";
import { CircleAccessDeniedError } from "@/features/v2/circle/service";
import {
  createSupportRequest,
  listSupportRequests,
} from "@/features/v2/support-requests/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute, readAuthRoute } from "@/lib/zod-route";

const getHandler = readAuthRoute.handler(async (request, { ctx }) => {
  const unavailable = getCircleAvailabilityError(request);
  if (unavailable) return unavailable;
  return apiSuccess(
    await listSupportRequests(ctx.user.id),
    getRequestId(request),
  );
});

const postHandler = authRoute
  .body(createSupportRequestSchema)
  .handler(async (request, { body, ctx }) => {
    const requestId = getRequestId(request);
    const unavailable = getCircleAvailabilityError(request);
    if (unavailable) return unavailable;
    try {
      return apiSuccess(
        await createSupportRequest(ctx.user.id, body),
        requestId,
        201,
      );
    } catch (error) {
      if (error instanceof CircleAccessDeniedError) {
        return apiError({
          code: "circle_permission_unavailable",
          message: "Cette personne ne peut plus recevoir cette demande.",
          recoverable: false,
          requestId,
          status: 403,
        });
      }
      throw error;
    }
  });

export const GET = withApiV2Route(getHandler);
export const POST = withApiV2Route(postHandler);
