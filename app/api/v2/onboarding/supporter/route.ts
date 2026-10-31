import { respond } from "@/features/couple/api";
import { completeSupporterOnboarding } from "@/features/couple/profile.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";
import { supporterOnboardingSchema } from "@moodday/contracts";

export const POST = withApiV2Route(
  authRoute
    .body(supporterOnboardingSchema)
    .handler(async (request, { ctx, body }) =>
      respond(request, async () => {
        await completeSupporterOnboarding(ctx.user.id, body);
        return { ok: true as const };
      }),
    ),
);
