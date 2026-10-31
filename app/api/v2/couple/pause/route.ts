import { respond } from "@/features/couple/api";
import { pauseSharing } from "@/features/couple/link.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";
import { pauseSharingSchema } from "@moodday/contracts";

export const POST = withApiV2Route(
  authRoute.body(pauseSharingSchema).handler(async (request, { ctx, body }) =>
    respond(request, async () => ({
      pausedUntil: (await pauseSharing(ctx.user.id, body.hours)).toISOString(),
    })),
  ),
);
