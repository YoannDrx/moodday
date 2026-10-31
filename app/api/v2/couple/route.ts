import { respond } from "@/features/couple/api";
import { endLink } from "@/features/couple/link.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";

export const DELETE = withApiV2Route(
  authRoute.handler(async (request, { ctx }) =>
    respond(request, async () => {
      await endLink(ctx.user.id);
      return { ok: true as const };
    }),
  ),
);
