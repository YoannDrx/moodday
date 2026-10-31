import { respond } from "@/features/couple/api";
import { completeOwnerOnboarding } from "@/features/couple/profile.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";
import { ownerOnboardingSchema } from "@moodday/contracts";

export const POST = withApiV2Route(
  authRoute
    .body(ownerOnboardingSchema)
    .handler(async (request, { ctx, body }) =>
      respond(request, async () => {
        await completeOwnerOnboarding(ctx.user.id, body);
        return { ok: true as const };
      }),
    ),
);
