import { z } from "zod";

export const LoginCredentialsFormScheme = z
  .object({
    name: z.string().min(1, {
      message: "Un petit nom pour qu'on puisse te saluer ? 👋",
    }),
    email: z.string().email({
      message: "Hmm, cette adresse email ne semble pas valide. On réessaie ?",
    }),
    password: z.string().min(8, {
      message:
        "Pour ta sécurité, choisis un mot de passe d'au moins 8 caractères",
    }),
    verifyPassword: z.string().min(8, {
      message: "Confirme ton mot de passe pour être sûr·e",
    }),
    image: z.string().optional(),
  })
  .refine((data) => data.password === data.verifyPassword, {
    message:
      "Les mots de passe ne correspondent pas. Pas de souci, on réessaie !",
    path: ["verifyPassword"],
  });

export type LoginCredentialsFormType = z.infer<
  typeof LoginCredentialsFormScheme
>;
