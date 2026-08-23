import { updateCalendarConnectionSchema } from "@moodday/contracts";
import { z } from "zod";
import {
  revokeCalendarConnection,
  updateCalendarConnection,
} from "@/features/v2/calendar/connection-service";
import { calendarErrorResponse } from "@/features/v2/calendar/http-error";
import {
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { sensitiveAuthRoute } from "@/lib/zod-route";

const paramsSchema = z.object({ connectionId: z.string().min(8).max(128) });

const patchHandler = sensitiveAuthRoute
  .params(paramsSchema)
  .body(updateCalendarConnectionSchema)
  .handler(async (request, { params, body, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await updateCalendarConnection(
          ctx.user.id,
          params.connectionId,
          body,
        ),
        requestId,
      );
    } catch (error) {
      const response = calendarErrorResponse(error, requestId);
      if (response) return response;
      throw error;
    }
  });

const deleteHandler = sensitiveAuthRoute
  .params(paramsSchema)
  .handler(async (request, { params, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await revokeCalendarConnection(ctx.user.id, params.connectionId),
        requestId,
      );
    } catch (error) {
      const response = calendarErrorResponse(error, requestId);
      if (response) return response;
      throw error;
    }
  });

export const PATCH = withApiV2Route(patchHandler);
export const DELETE = withApiV2Route(deleteHandler);
