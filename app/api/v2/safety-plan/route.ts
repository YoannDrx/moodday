import { safetyPlanWriteSchema } from "@moodday/contracts";
import {
  getSafetyPlan,
  saveSafetyPlan,
} from "@/features/v2/safety-plan/service";
import {
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { authRoute, readAuthRoute } from "@/lib/zod-route";

const getHandler = readAuthRoute.handler(async (request, { ctx }) =>
  apiSuccess(await getSafetyPlan(ctx.user.id), getRequestId(request)),
);

const putHandler = authRoute
  .body(safetyPlanWriteSchema)
  .handler(async (request, { body, ctx }) =>
    apiSuccess(await saveSafetyPlan(ctx.user.id, body), getRequestId(request)),
  );

export const GET = withApiV2Route(getHandler);
export const PUT = withApiV2Route(putHandler);
