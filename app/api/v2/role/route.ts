import { respond } from "@/features/couple/api";
import { chooseRole } from "@/features/couple/profile.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";
import { chooseRoleSchema } from "@moodday/contracts";

export const POST = withApiV2Route(
  authRoute.body(chooseRoleSchema).handler(async (request, { ctx, body }) =>
    respond(request, async () => {
      const profile = await chooseRole(ctx.user.id, body.role);
      return { role: profile.role };
    }),
  ),
);
