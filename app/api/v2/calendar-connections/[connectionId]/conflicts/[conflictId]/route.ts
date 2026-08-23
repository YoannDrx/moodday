import { resolveCalendarConflictSchema } from "@moodday/contracts";
import { z } from "zod";
import { resolveCalendarConflict } from "@/features/v2/calendar/conflict-service";
import { calendarErrorResponse } from "@/features/v2/calendar/http-error";
import {
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";

const paramsSchema = z.object({
  connectionId: z.string().min(8).max(128),
  conflictId: z.string().min(8).max(128),
});

const handler = authRoute
  .params(paramsSchema)
  .body(resolveCalendarConflictSchema)
  .handler(async (request, { params, body, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await resolveCalendarConflict(
          ctx.user.id,
          params.connectionId,
          params.conflictId,
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

export const POST = withApiV2Route(handler);
