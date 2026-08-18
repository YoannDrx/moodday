"use server";

import { verifiedAuthAction } from "@/lib/actions/safe-actions";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export const acceptRequiredConsents = verifiedAuthAction
  .inputSchema(
    z.object({
      age18Accepted: z.literal(true),
      termsAccepted: z.literal(true),
      privacyAccepted: z.literal(true),
      healthDataConsentAccepted: z.literal(true),
      locale: z.enum(["fr", "en"]),
    }),
  )
  .action(async ({ parsedInput, ctx: { user } }) => {
    await prisma.userConsent.createMany({
      data: [
        {
          userId: user.id,
          purpose: "age_18",
          version: String(env.MINIMUM_AGE),
          locale: parsedInput.locale,
          country: env.LAUNCH_COUNTRY,
          source: "migration_gate",
        },
        {
          userId: user.id,
          purpose: "terms",
          version: env.LEGAL_TERMS_VERSION,
          locale: parsedInput.locale,
          country: env.LAUNCH_COUNTRY,
          source: "migration_gate",
        },
        {
          userId: user.id,
          purpose: "privacy",
          version: env.LEGAL_PRIVACY_VERSION,
          locale: parsedInput.locale,
          country: env.LAUNCH_COUNTRY,
          source: "migration_gate",
        },
        {
          userId: user.id,
          purpose: "health_data",
          version: env.HEALTH_DATA_CONSENT_VERSION,
          locale: parsedInput.locale,
          country: env.LAUNCH_COUNTRY,
          source: "migration_gate",
        },
      ],
      skipDuplicates: true,
    });

    return { accepted: true };
  });
