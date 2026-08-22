import { syncPushSchema } from "@moodday/contracts";
import { pushSyncOperations } from "@/features/v2/sync/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";

const postHandler = authRoute
  .body(syncPushSchema)
  .handler(async (request, { body, ctx }) => {
    const requestId = getRequestId(request);
    try {
      return apiSuccess(await pushSyncOperations(ctx.user.id, body), requestId);
    } catch (error) {
      const revoked =
        error instanceof Error &&
        error.message === "Device access has been revoked";
      return apiError({
        code: revoked ? "device_revoked" : "sync_push_unavailable",
        message: revoked
          ? "Cet appareil a été révoqué. Reconnecte-toi pour continuer."
          : "La synchronisation n’a pas pu être terminée.",
        recoverable: !revoked,
        requestId,
        status: revoked ? 403 : 503,
      });
    }
  });

export const POST = withApiV2Route(postHandler);
