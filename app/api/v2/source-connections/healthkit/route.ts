import { connectHealthKitSchema } from "@moodday/contracts";
import {
  connectHealthKit,
  getHealthKitConnection,
} from "@/features/v2/health/service";
import {
  apiError,
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { getFeatureAvailability } from "@/lib/features/availability";
import { authRoute, readAuthRoute } from "@/lib/zod-route";

const getHandler = readAuthRoute.handler(async (request, { ctx }) =>
  apiSuccess(await getHealthKitConnection(ctx.user.id), getRequestId(request)),
);

const postHandler = authRoute
  .body(connectHealthKitSchema)
  .handler(async (request, { body, ctx }) => {
    const requestId = getRequestId(request);
    if (!getFeatureAvailability("healthKit").enabled) {
      return apiError({
        code: "healthkit_unavailable",
        message: "La connexion Santé n’est pas encore disponible.",
        recoverable: false,
        requestId,
        status: 403,
      });
    }
    return apiSuccess(
      await connectHealthKit(ctx.user.id, body),
      requestId,
      201,
    );
  });

export const GET = withApiV2Route(getHandler);
export const POST = withApiV2Route(postHandler);
