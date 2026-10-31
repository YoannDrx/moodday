import { completeLesson } from "@/features/couple/ally.service";
import { respond } from "@/features/couple/api";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";
import { z } from "zod";

export const POST = withApiV2Route(
  authRoute
    .params(z.object({ slug: z.string().min(1).max(80) }))
    .handler(async (request, { ctx, params }) =>
      respond(request, async () => {
        await completeLesson(ctx.user.id, params.slug);
        return { ok: true as const };
      }),
    ),
);
