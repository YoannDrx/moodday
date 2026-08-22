import { syncPullQuerySchema } from "@moodday/contracts";
import {
  InvalidSyncCursorError,
  pullSyncChanges,
} from "@/features/v2/sync/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { readAuthRoute } from "@/lib/zod-route";

const getHandler = readAuthRoute
  .query(syncPullQuerySchema)
  .handler(async (request, { query, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(
        await pullSyncChanges({
          userId: ctx.user.id,
          cursor: query.cursor,
          limit: query.limit,
        }),
        requestId,
      );
    } catch (error) {
      const invalidCursor = error instanceof InvalidSyncCursorError;
      return apiError({
        code: invalidCursor ? "invalid_sync_cursor" : "sync_pull_unavailable",
        message: invalidCursor
          ? "Le curseur de synchronisation est invalide. Une reprise complète est nécessaire."
          : "Les changements ne peuvent pas être récupérés pour le moment.",
        recoverable: true,
        requestId,
        status: invalidCursor ? 409 : 503,
      });
    }
  });

export const GET = withApiV2Route(getHandler);
