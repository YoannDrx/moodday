import { z } from "zod";

export const NewsletterSchema = z.object({
  email: z.string().email(),
  locale: z.string().default("fr"),
  source: z.string().default("landing"),
});

export type NewsletterInput = z.infer<typeof NewsletterSchema>;
