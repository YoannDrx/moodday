import { z } from "zod";
import { calendarErrorResponse } from "@/features/v2/calendar/http-error";
import { synchronizeGoogleCalendar } from "@/features/v2/calendar/sync-service";
import {
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";

const paramsSchema = z.object({ connectionId: z.string().min(8).max(128) });

const handler = authRoute
  .params(paramsSchema)
  .handler(async (request, { params, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await synchronizeGoogleCalendar(ctx.user.id, params.connectionId),
        requestId,
      );
    } catch (error) {
      const response = calendarErrorResponse(error, requestId);
      if (response) return response;
      throw error;
    }
  });

export const POST = withApiV2Route(handler);
