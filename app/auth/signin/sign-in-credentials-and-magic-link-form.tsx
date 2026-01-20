"use client";

import { Typography } from "@/components/nowts/typography";
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
import { LoadingButton } from "@/features/form/submit-button";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { getCallbackUrl } from "@/lib/auth/auth-utils";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocalStorage } from "react-use";
import { toast } from "sonner";
import { z } from "zod";

const LoginCredentialsFormScheme = z.object({
  email: z.string().email(),
  password: z.string().optional(),
});

type LoginCredentialsFormType = z.infer<typeof LoginCredentialsFormScheme>;

export const SignInCredentialsAndMagicLinkForm = (props: {
  callbackUrl?: string;
}) => {
  const { t } = useI18n();
  const form = useZodForm({
    schema: LoginCredentialsFormScheme,
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const [mounted, setMounted] = useState(false);
  const [isUsingCredentials, setIsUsingCredentials] = useLocalStorage(
    "sign-in-with-credentials",
    true,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const signInMutation = useMutation({
    mutationFn: async (values: LoginCredentialsFormType) => {
      if (isUsingCredentials) {
        return unwrapSafePromise(
          authClient.signIn.email({
            email: values.email,
            password: values.password ?? "",
            rememberMe: true,
          }),
        );
      } else {
        return unwrapSafePromise(
          authClient.signIn.magicLink({
            email: values.email,
            callbackURL: getCallbackUrl(props.callbackUrl ?? "/app"),
          }),
        );
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      const callbackUrl = getCallbackUrl(props.callbackUrl ?? "/app");
      const newUrl =
        window.location.origin +
        (isUsingCredentials ? callbackUrl : "/auth/verify");
      window.location.href = newUrl;
    },
  });

  function onSubmit(values: LoginCredentialsFormType) {
    signInMutation.mutate(values);
  }

  return (
    <Form form={form} onSubmit={onSubmit} className="max-w-lg space-y-4">
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("auth.form.email")}</FormLabel>
            <FormControl>
              <Input
                placeholder={t("auth.signIn.emailPlaceholder")}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {mounted && isUsingCredentials ? (
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="flex-1">
              <div className="flex items-center justify-between">
                <FormLabel>{t("auth.form.password")}</FormLabel>
                <Link
                  href="/auth/forget-password"
                  className="text-sm underline"
                >
                  {t("auth.signIn.forgotPassword")}
                </Link>
              </div>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      <LoadingButton
        loading={signInMutation.isPending}
        type="submit"
        className="ring-offset-card w-full ring-offset-2"
      >
        {!mounted || isUsingCredentials
          ? t("auth.signIn.submit")
          : t("auth.signIn.magicLinkSubmit")}
      </LoadingButton>

      {mounted ? (
        isUsingCredentials ? (
          <Typography variant="muted" className="text-xs">
            {t("auth.signIn.magicLinkPrompt")}{" "}
            <Typography
              variant="link"
              as="button"
              type="button"
              onClick={() => {
                setIsUsingCredentials(false);
              }}
            >
              {t("auth.signIn.magicLinkAction")}
            </Typography>
          </Typography>
        ) : (
          <Typography variant="muted" className="text-xs">
            {t("auth.signIn.passwordPrompt")}{" "}
            <Typography
              variant="link"
              as="button"
              type="button"
              onClick={() => {
                setIsUsingCredentials(true);
              }}
            >
              {t("auth.signIn.passwordAction")}
            </Typography>
          </Typography>
        )
      ) : null}
    </Form>
  );
};
