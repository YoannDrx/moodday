import { updateHealthSourceSchema } from "@moodday/contracts";
import { z } from "zod";
import { healthErrorResponse } from "@/features/v2/health/http-error";
import {
  revokeHealthKitConnection,
  updateHealthKitConnection,
} from "@/features/v2/health/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { getFeatureAvailability } from "@/lib/features/availability";
import { authRoute, sensitiveAuthRoute } from "@/lib/zod-route";

const paramsSchema = z.object({ connectionId: z.string().min(8).max(128) });

const patchHandler = authRoute
  .params(paramsSchema)
  .body(updateHealthSourceSchema)
  .handler(async (request, { params, body, ctx }) => {
    const requestId = getRequestId(request);
    if (
      body.status === "active" &&
      !getFeatureAvailability("healthKit").enabled
    ) {
      return apiError({
        code: "healthkit_unavailable",
        message: "La synchronisation Santé est désactivée.",
        recoverable: false,
        requestId,
        status: 403,
      });
    }
    try {
      return apiSuccess(
        await updateHealthKitConnection(ctx.user.id, params.connectionId, body),
        requestId,
      );
    } catch (error) {
      return healthErrorResponse(error, requestId) ?? Promise.reject(error);
    }
  });

const deleteHandler = sensitiveAuthRoute
  .params(paramsSchema)
  .handler(async (request, { params, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await revokeHealthKitConnection(ctx.user.id, params.connectionId),
        requestId,
      );
    } catch (error) {
      return healthErrorResponse(error, requestId) ?? Promise.reject(error);
    }
  });

export const PATCH = withApiV2Route(patchHandler);
export const DELETE = withApiV2Route(deleteHandler);
