import { respond } from "@/features/couple/api";
import { cancelInvite, createInvite } from "@/features/couple/link.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";

export const POST = withApiV2Route(
  authRoute.handler(async (request, { ctx }) =>
    respond(request, async () => createInvite(ctx.user.id), 201),
  ),
);

export const DELETE = withApiV2Route(
  authRoute.handler(async (request, { ctx }) =>
    respond(request, async () => {
      await cancelInvite(ctx.user.id);
      return { ok: true as const };
    }),
  ),
);
