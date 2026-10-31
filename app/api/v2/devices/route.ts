import { respond } from "@/features/couple/api";
import { withApiV2Route } from "@/lib/api-v2/responses";
import { prisma } from "@/lib/prisma";
import { authRoute } from "@/lib/zod-route";
import { registerDeviceSchema } from "@moodday/contracts";

export const POST = withApiV2Route(
  authRoute.body(registerDeviceSchema).handler(async (request, { ctx, body }) =>
    respond(request, async () => {
      const data = {
        platform: body.platform,
        displayName: body.displayName ?? null,
        pushToken: body.pushToken,
        pushTokenUpdatedAt: body.pushToken ? new Date() : null,
        lastSeenAt: new Date(),
        revokedAt: null,
      };
      await prisma.device.upsert({
        where: {
          userId_publicId: { userId: ctx.user.id, publicId: body.publicId },
        },
        create: { ...data, userId: ctx.user.id, publicId: body.publicId },
        update: data,
      });
      return { ok: true as const };
    }),
  ),
);
