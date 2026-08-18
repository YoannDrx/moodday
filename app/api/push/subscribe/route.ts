import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authRoute } from "@/lib/zod-route";
import { assertFeatureAvailable } from "@/lib/features/availability";
import { getEffectivePushContentMode } from "@/features/pwa/push-privacy";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  deviceId: z.string().min(1).max(128),
  locale: z.enum(["fr", "en"]),
  contentMode: z.enum(["generic", "detailed"]).default("generic"),
  trustedDevice: z.boolean().default(false),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export const POST = authRoute
  .body(subscriptionSchema)
  .handler(async (request, { body, ctx }) => {
    assertFeatureAvailable("pushNotifications");
    const {
      endpoint,
      expirationTime,
      keys,
      deviceId,
      locale,
      contentMode,
      trustedDevice,
    } = body;
    const effectiveContentMode = getEffectivePushContentMode({
      contentMode,
      trustedDevice,
    });

    await prisma.$transaction(async (transaction) => {
      const existing = await transaction.pushSubscription.findUnique({
        where: { endpoint },
        select: { userId: true },
      });
      if (existing && existing.userId !== ctx.user.id) {
        throw new Error("Push endpoint belongs to another account");
      }

      await transaction.pushSubscription.upsert({
        where: { endpoint },
        update: {
          p256dh: keys.p256dh,
          auth: keys.auth,
          deviceId,
          locale,
          contentMode: effectiveContentMode,
          trustedDevice,
          disabledAt: null,
          enabledAt: new Date(),
          expirationTime: expirationTime ? new Date(expirationTime) : null,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
        create: {
          userId: ctx.user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          deviceId,
          locale,
          contentMode: effectiveContentMode,
          trustedDevice,
          expirationTime: expirationTime ? new Date(expirationTime) : null,
          userAgent: request.headers.get("user-agent") ?? undefined,
        },
      });
    });

    return { ok: true };
  });
