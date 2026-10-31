import { respond, todayFor } from "@/features/couple/api";
import { saveCheckIn, toCheckInDto } from "@/features/couple/check-in.service";
import {
  checkInDeliveryKey,
  queuePartnerNotification,
} from "@/features/couple/notify.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute } from "@/lib/zod-route";
import { saveCheckInSchema } from "@moodday/contracts";

export const POST = withApiV2Route(
  authRoute.body(saveCheckInSchema).handler(async (request, { ctx, body }) =>
    respond(request, async () => {
      const { checkIn } = await saveCheckIn(
        ctx.user.id,
        body,
        await todayFor(ctx.user.id),
      );
      await queuePartnerNotification(
        checkInDeliveryKey(ctx.user.id, checkIn.localDate),
      );
      return toCheckInDto(checkIn);
    }),
  ),
);
