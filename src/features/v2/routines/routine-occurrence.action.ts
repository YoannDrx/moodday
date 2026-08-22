"use server";

import { createRoutineOccurrenceSchema } from "@moodday/contracts";
import { authAction } from "@/lib/actions/safe-actions";
import { createRoutineOccurrence } from "./occurrence-service";

export const createV2RoutineOccurrence = authAction
  .inputSchema(createRoutineOccurrenceSchema)
  .action(async ({ parsedInput, ctx: { user } }) =>
    createRoutineOccurrence(user.id, parsedInput),
  );
