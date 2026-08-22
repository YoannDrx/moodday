import { todayQuerySchema } from "@moodday/contracts";
import { getToday } from "@/features/v2/today/service";
import {
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { readAuthRoute } from "@/lib/zod-route";

const getHandler = readAuthRoute
  .query(todayQuerySchema)
  .handler(async (request, { query, ctx }) => {
    const requestId = getRequestId(request);
    return apiSuccess(
      await getToday({ userId: ctx.user.id, localDate: query.localDate }),
      requestId,
    );
  });

export const GET = withApiV2Route(getHandler);
