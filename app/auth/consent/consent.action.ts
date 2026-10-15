"use server";

import { verifiedAuthAction } from "@/lib/actions/safe-actions";
import { recordRequiredConsents } from "@/lib/auth/required-consents";
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
    await recordRequiredConsents(user.id, parsedInput.locale);

    return { accepted: true };
  });
