import { respondSupportRequestSchema } from "@moodday/contracts";
import { z } from "zod";
import { getCircleAvailabilityError } from "@/features/v2/circle/availability";
import { CircleAccessDeniedError } from "@/features/v2/circle/service";
import { respondToSupportRequest } from "@/features/v2/support-requests/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";

const paramsSchema = z.object({ supportRequestId: z.string().min(8).max(128) });

const patchHandler = authRoute
  .params(paramsSchema)
  .body(respondSupportRequestSchema)
  .handler(async (request, { params, body, ctx }) => {
    const requestId = getRequestId(request);
    const unavailable = getCircleAvailabilityError(request);
    if (unavailable) return unavailable;
    try {
      return apiSuccess(
        await respondToSupportRequest({
          caregiverId: ctx.user.id,
          supportRequestId: params.supportRequestId,
          status: body.status,
          requestId,
        }),
        requestId,
      );
    } catch (error) {
      if (error instanceof CircleAccessDeniedError) {
        return apiError({
          code: "support_request_unavailable",
          message: "Cette demande n’est plus disponible.",
          recoverable: false,
          requestId,
          status: 403,
        });
      }
      throw error;
    }
  });

export const PATCH = withApiV2Route(patchHandler);
