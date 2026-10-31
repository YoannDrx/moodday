import { respond } from "@/features/couple/api";
import { resumeSharing } from "@/features/couple/link.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";

export const POST = withApiV2Route(
  authRoute.handler(async (request, { ctx }) =>
    respond(request, async () => {
      await resumeSharing(ctx.user.id);
      return { ok: true as const };
    }),
  ),
);
