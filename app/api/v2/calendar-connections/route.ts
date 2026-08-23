import { createGoogleCalendarConnectionSchema } from "@moodday/contracts";
import {
  createGoogleCalendarConnection,
  listCalendarConnections,
} from "@/features/v2/calendar/connection-service";
import { calendarErrorResponse } from "@/features/v2/calendar/http-error";
import {
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute, readAuthRoute } from "@/lib/zod-route";

const getHandler = readAuthRoute.handler(async (request, { ctx }) => {
  const requestId = getRequestId(request);
  return apiSuccess(await listCalendarConnections(ctx.user.id), requestId);
});

const postHandler = authRoute
  .body(createGoogleCalendarConnectionSchema)
  .handler(async (request, { body, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await createGoogleCalendarConnection(ctx.user.id, body),
        requestId,
        201,
      );
    } catch (error) {
      const response = calendarErrorResponse(error, requestId);
      if (response) return response;
      throw error;
    }
  });

export const GET = withApiV2Route(getHandler);
export const POST = withApiV2Route(postHandler);
