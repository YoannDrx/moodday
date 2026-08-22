import { createCheckInSchema } from "@moodday/contracts";
import { z } from "zod";
import { createCheckIn, listCheckIns } from "@/features/v2/check-ins/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { logger } from "@/lib/logger";
import { authRoute, readAuthRoute } from "@/lib/zod-route";

const listQuerySchema = z.object({
  cursor: z.string().max(128).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const getHandler = readAuthRoute
  .query(listQuerySchema)
  .handler(async (request, { query, ctx }) => {
    const requestId = getRequestId(request);
    return apiSuccess(
      await listCheckIns({
        userId: ctx.user.id,
        cursor: query.cursor,
        limit: query.limit,
      }),
      requestId,
    );
  });

const postHandler = authRoute
  .body(createCheckInSchema)
  .handler(async (request, { body, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(await createCheckIn(ctx.user.id, body), requestId, 201);
    } catch (error) {
      logger.info("V2 check-in request failed", {
        eventName: "v2_check_in_failed",
        errorCode: error instanceof Error ? error.name : "unknown_error",
        requestId,
      });
      return apiError({
        code: "check_in_unavailable",
        message: "Le point du jour n’a pas pu être enregistré.",
        recoverable: true,
        requestId,
        status: 503,
      });
    }
  });

export const GET = withApiV2Route(getHandler);
export const POST = withApiV2Route(postHandler);
