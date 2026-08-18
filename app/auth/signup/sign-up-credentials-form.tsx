"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { getCallbackUrl } from "@/lib/auth/auth-utils";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LoginCredentialsFormType } from "./signup.schema";
import { getLoginCredentialsFormSchema } from "./signup.schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SignUpCredentialsFormProps = {
  termsVersion: string;
  privacyVersion: string;
  healthDataConsentVersion: string;
  launchCountry: "FR";
};

export const SignUpCredentialsForm = ({
  termsVersion,
  privacyVersion,
  healthDataConsentVersion,
  launchCountry,
}: SignUpCredentialsFormProps) => {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const schema = getLoginCredentialsFormSchema(t);
  const form = useZodForm({
    schema,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      verifyPassword: "",
      image: "",
      age18Accepted: false,
      termsAccepted: false,
      privacyAccepted: false,
      healthDataConsentAccepted: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (values: LoginCredentialsFormType) => {
      return unwrapSafePromise(
        authClient.signUp.email({
          email: values.email,
          password: values.password,
          name: values.name,
          image: values.image,
          callbackURL: getCallbackUrl("/dashboard"),
          age18Accepted: values.age18Accepted,
          termsVersionAccepted: termsVersion,
          privacyVersionAccepted: privacyVersion,
          healthDataConsentVersionAccepted: healthDataConsentVersion,
          signupLocale: locale,
          launchCountry,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      router.replace("/auth/verify");
      router.refresh();
    },
  });

  useEffect(() => setIsHydrated(true), []);

  async function onSubmit(values: LoginCredentialsFormType) {
    if (values.password !== values.verifyPassword) {
      form.setError("verifyPassword", {
        message: t("auth.signUp.passwordMismatch"),
      });
      return;
    }

    return submitMutation.mutateAsync(values);
  }

  return (
    <Form
      form={form}
      onSubmit={async (values) => {
        return onSubmit(values);
      }}
      className="max-w-lg"
    >
      <fieldset
        disabled={!isHydrated || submitMutation.isPending}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.form.name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("auth.signUp.namePlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.form.email")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("auth.signUp.emailPlaceholder")}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.form.password")}</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="verifyPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.signUp.verifyPassword")}</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="age18Accepted"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) =>
                    field.onChange(event.currentTarget.checked)
                  }
                  className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                />
              </FormControl>
              <div>
                <FormLabel>{t("auth.signUp.ageConsent")}</FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="termsAccepted"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) =>
                    field.onChange(event.currentTarget.checked)
                  }
                  className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                />
              </FormControl>
              <div>
                <FormLabel>
                  {t("auth.signUp.termsConsent")}{" "}
                  <Link
                    className="underline"
                    href="/legal/terms"
                    target="_blank"
                  >
                    {t("nav.terms")}
                  </Link>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="privacyAccepted"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) =>
                    field.onChange(event.currentTarget.checked)
                  }
                  className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                />
              </FormControl>
              <div>
                <FormLabel>
                  {t("auth.signUp.privacyConsent")}{" "}
                  <Link
                    className="underline"
                    href="/legal/privacy"
                    target="_blank"
                  >
                    {t("nav.privacy")}
                  </Link>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="healthDataConsentAccepted"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(event) =>
                    field.onChange(event.currentTarget.checked)
                  }
                  className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
                />
              </FormControl>
              <div>
                <FormLabel>{t("auth.signUp.healthDataConsent")}</FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full disabled:opacity-100">
          {t("auth.signUp.submit")}
        </Button>
      </fieldset>
    </Form>
  );
};
