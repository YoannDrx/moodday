import { getClientVisibleFeatures } from "@/lib/features/availability";
import {
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { readAuthRoute } from "@/lib/zod-route";

const handler = readAuthRoute.handler(async (request) =>
  apiSuccess(getClientVisibleFeatures(), getRequestId(request)),
);

export const GET = withApiV2Route(handler);
