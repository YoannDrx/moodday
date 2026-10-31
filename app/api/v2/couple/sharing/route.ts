import { respond } from "@/features/couple/api";
import { updateSharing } from "@/features/couple/link.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";
import { updateSharingSchema } from "@moodday/contracts";

export const PATCH = withApiV2Route(
  authRoute.body(updateSharingSchema).handler(async (request, { ctx, body }) =>
    respond(request, async () => {
      await updateSharing(ctx.user.id, body);
      return { ok: true as const };
    }),
  ),
);
