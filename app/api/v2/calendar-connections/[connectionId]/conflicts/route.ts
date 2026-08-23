import { z } from "zod";
import { listCalendarConflicts } from "@/features/v2/calendar/conflict-service";
import {
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { readAuthRoute } from "@/lib/zod-route";

const paramsSchema = z.object({ connectionId: z.string().min(8).max(128) });

const handler = readAuthRoute
  .params(paramsSchema)
  .handler(async (request, { params, ctx }) =>
    apiSuccess(
      await listCalendarConflicts(ctx.user.id, params.connectionId),
      getRequestId(request),
    ),
  );

export const GET = withApiV2Route(handler);
