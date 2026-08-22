import { getV2PlusEntitlement } from "@/features/v2/entitlements/service";
import {
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { readAuthRoute } from "@/lib/zod-route";

const getHandler = readAuthRoute.handler(async (request, { ctx }) =>
  apiSuccess(await getV2PlusEntitlement(ctx.user.id), getRequestId(request)),
);

export const GET = withApiV2Route(getHandler);
