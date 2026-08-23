import { getSyncedPreferences } from "@/features/v2/preferences-drafts/service";
import {
  apiSuccess,
  getRequestId,
  withApiV2Route,
} from "@/lib/api-v2/responses";
import { readAuthRoute } from "@/lib/zod-route";

const getHandler = readAuthRoute.handler(async (request, { ctx }) =>
  apiSuccess(await getSyncedPreferences(ctx.user.id), getRequestId(request)),
);

export const GET = withApiV2Route(getHandler);
