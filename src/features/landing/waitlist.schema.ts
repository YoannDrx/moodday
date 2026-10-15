import { z } from "zod";

export const JoinWaitlistSchema = z.object({
  email: z.string().trim().email().max(254),
  locale: z.enum(["fr", "en"]).default("fr"),
});

export type JoinWaitlistInput = z.input<typeof JoinWaitlistSchema>;
