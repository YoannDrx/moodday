import { respond } from "@/features/couple/api";
import { thankGesture } from "@/features/couple/gesture.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";
import { z } from "zod";

export const POST = withApiV2Route(
  authRoute
    .params(z.object({ gestureId: z.string().min(1) }))
    .handler(async (request, { ctx, params }) =>
      respond(request, async () => {
        await thankGesture(ctx.user.id, params.gestureId);
        return { ok: true as const };
      }),
    ),
);
