import { respond } from "@/features/couple/api";
import { listGestures, sendGesture } from "@/features/couple/gesture.service";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { authRoute, readAuthRoute } from "@/lib/zod-route";
import { sendGestureSchema } from "@moodday/contracts";

export const POST = withApiV2Route(
  authRoute.body(sendGestureSchema).handler(async (request, { ctx, body }) =>
    respond(
      request,
      async () => {
        const gesture = await sendGesture(ctx.user.id, body);
        const [dto] = (await listGestures(ctx.user.id, 20)).filter(
          (item) => item.id === gesture.id,
        );
        return dto;
      },
      201,
    ),
  ),
);

export const GET = withApiV2Route(
  readAuthRoute.handler(async (request, { ctx }) =>
    respond(request, async () => listGestures(ctx.user.id, 100)),
  ),
);
