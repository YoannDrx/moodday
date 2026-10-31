import { respond } from "@/features/couple/api";
import { listPeriods } from "@/features/couple/cycle.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { readAuthRoute } from "@/lib/zod-route";

export const GET = withApiV2Route(
  readAuthRoute.handler(async (request, { ctx }) =>
    respond(request, async () => listPeriods(ctx.user.id)),
  ),
);
