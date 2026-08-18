import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authRoute } from "@/lib/zod-route";

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const POST = authRoute
  .body(unsubscribeSchema)
  .handler(async (_request, { body, ctx }) => {
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint: body.endpoint,
        userId: ctx.user.id,
      },
    });

    return { ok: true };
  });

// Cleanup must remain available when push delivery is disabled. Otherwise a
// kill switch could prevent a signed-in user from revoking old endpoints.
export const DELETE = authRoute.handler(async (_request, { ctx }) => {
  await prisma.pushSubscription.deleteMany({
    where: { userId: ctx.user.id },
  });

  return { ok: true };
});
