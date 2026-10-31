import { respond } from "@/features/couple/api";
import { markGesturesSeen } from "@/features/couple/gesture.service";
import { getToday } from "@/features/couple/today.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { readAuthRoute } from "@/lib/zod-route";

export const GET = withApiV2Route(
  readAuthRoute.handler(async (request, { ctx }) =>
    respond(request, async () => {
      const today = await getToday(ctx.user.id);
      if (today.role === "cycle_owner") await markGesturesSeen(ctx.user.id);
      return today;
    }),
  ),
);
