import { z } from "zod";

type Translator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export const getLoginCredentialsFormSchema = (t: Translator) =>
  z
    .object({
      name: z.string().min(1, {
        message: t("auth.signUp.validation.nameRequired"),
      }),
      email: z.string().email({
        message: t("auth.signUp.validation.emailInvalid"),
      }),
      password: z.string().min(8, {
        message: t("auth.signUp.validation.passwordMin"),
      }),
      verifyPassword: z.string().min(8, {
        message: t("auth.signUp.validation.verifyPasswordMin"),
      }),
      image: z.string().optional(),
      age18Accepted: z.boolean().refine(Boolean, {
        message: t("auth.signUp.validation.ageRequired"),
      }),
      termsAccepted: z.boolean().refine(Boolean, {
        message: t("auth.signUp.validation.termsRequired"),
      }),
      privacyAccepted: z.boolean().refine(Boolean, {
        message: t("auth.signUp.validation.privacyRequired"),
      }),
      healthDataConsentAccepted: z.boolean().refine(Boolean, {
        message: t("auth.signUp.validation.healthDataConsentRequired"),
      }),
    })
    .refine((data) => data.password === data.verifyPassword, {
      message: t("auth.signUp.validation.passwordMismatch"),
      path: ["verifyPassword"],
    });

export type LoginCredentialsFormType = z.infer<
  ReturnType<typeof getLoginCredentialsFormSchema>
>;
