import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authRoute } from "@/lib/zod-route";

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const POST = authRoute.body(unsubscribeSchema).handler(
  async (_request, { body, ctx }) => {
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint: body.endpoint,
        userId: ctx.user.id,
      },
    });

    return { ok: true };
  },
);
