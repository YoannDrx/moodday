import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authRoute } from "@/lib/zod-route";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export const POST = authRoute.body(subscriptionSchema).handler(
  async (request, { body, ctx }) => {
    const { endpoint, expirationTime, keys } = body;

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: ctx.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        expirationTime: expirationTime ? new Date(expirationTime) : null,
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
      create: {
        userId: ctx.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        expirationTime: expirationTime ? new Date(expirationTime) : null,
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    });

    return { ok: true };
  },
);
