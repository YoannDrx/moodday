import { respond } from "@/features/couple/api";
import { acceptInvite } from "@/features/couple/link.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";
import { acceptInviteSchema } from "@moodday/contracts";

export const POST = withApiV2Route(
  authRoute.body(acceptInviteSchema).handler(async (request, { ctx, body }) =>
    respond(request, async () => {
      const link = await acceptInvite(ctx.user.id, body.code);
      return { linkId: link.id };
    }),
  ),
);
