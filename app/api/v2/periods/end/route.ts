import { respond } from "@/features/couple/api";
import { endPeriod } from "@/features/couple/cycle.service";
import { toCivil } from "@/features/couple/shared";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";
import { periodDateSchema } from "@moodday/contracts";

export const POST = withApiV2Route(
  authRoute.body(periodDateSchema).handler(async (request, { ctx, body }) =>
    respond(request, async () => {
      const period = await endPeriod(ctx.user.id, body.date);
      return {
        id: period.id,
        startDate: toCivil(period.startDate),
        endDate: period.endDate ? toCivil(period.endDate) : null,
      };
    }),
  ),
);
