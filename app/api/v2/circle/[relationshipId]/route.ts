import { z } from "zod";
import { getCircleAvailabilityError } from "@/features/v2/circle/availability";
import {
  CircleAccessDeniedError,
  revokeCircleRelationship,
} from "@/features/v2/circle/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";

const paramsSchema = z.object({ relationshipId: z.string().min(8).max(128) });

const deleteHandler = authRoute
  .params(paramsSchema)
  .handler(async (request, { params, ctx }) => {
    const requestId = getRequestId(request);
    const unavailable = getCircleAvailabilityError(request);
    if (unavailable) return unavailable;
    try {
      await revokeCircleRelationship({
        patientId: ctx.user.id,
        relationshipId: params.relationshipId,
        requestId,
      });
      return apiSuccess({ revoked: true }, requestId);
    } catch (error) {
      if (error instanceof CircleAccessDeniedError) {
        return apiError({
          code: "circle_relationship_not_found",
          message: "Cette relation n’est pas disponible.",
          recoverable: false,
          requestId,
          status: 404,
        });
      }
      throw error;
    }
  });

export const DELETE = withApiV2Route(deleteHandler);
