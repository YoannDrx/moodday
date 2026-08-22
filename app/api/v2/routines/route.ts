import { createRoutineSchema } from "@moodday/contracts";
import { z } from "zod";
import { createRoutine, listRoutines } from "@/features/v2/routines/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute, readAuthRoute } from "@/lib/zod-route";

const listQuerySchema = z.object({
  cursor: z.string().max(128).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

const getHandler = readAuthRoute
  .query(listQuerySchema)
  .handler(async (request, { query, ctx }) => {
    const requestId = getRequestId(request);
    const data = await listRoutines({
      userId: ctx.user.id,
      cursor: query.cursor,
      limit: query.limit,
    });
    return apiSuccess(data, requestId);
  });

const postHandler = authRoute
  .body(createRoutineSchema)
  .handler(async (request, { body, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(await createRoutine(ctx.user.id, body), requestId, 201);
    } catch {
      return apiError({
        code: "routine_unavailable",
        message: "La routine n’a pas pu être enregistrée.",
        recoverable: true,
        requestId,
        status: 503,
      });
    }
  });

export const GET = withApiV2Route(getHandler);
export const POST = withApiV2Route(postHandler);
