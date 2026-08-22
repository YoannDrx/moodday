"use server";

import { createCheckInSchema } from "@moodday/contracts";
import { authAction } from "@/lib/actions/safe-actions";
import { createCheckIn } from "./service";

export const createV2CheckIn = authAction
  .inputSchema(createCheckInSchema)
  .action(async ({ parsedInput, ctx: { user } }) =>
    createCheckIn(user.id, parsedInput),
  );
