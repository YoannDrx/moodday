import { z } from "zod";

export const ContactSupportSchema = z.object({
  firstname: z.string().trim().max(100).optional(),
  lastname: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().email().max(254),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2_000),
});

export type ContactSupportSchemaType = z.infer<typeof ContactSupportSchema>;
