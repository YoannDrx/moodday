"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { LoadingButton } from "@/features/form/submit-button";
import { useI18n } from "@/i18n/provider";
import { authClient } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export function ChangePasswordForm() {
  const router = useRouter();
  const { t } = useI18n();
  const [isHydrated, setIsHydrated] = useState(false);
  const ChangePasswordFormSchema = z
    .object({
      currentPassword: z.string().min(1, t("account.password.currentRequired")),
      newPassword: z.string().min(8, t("account.password.minLength")),
      confirmPassword: z.string().min(8, t("account.password.minLength")),
      revokeOtherSessions: z.boolean().default(true),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("account.password.mismatch"),
      path: ["confirmPassword"],
    });

  const form = useZodForm({
    schema: ChangePasswordFormSchema,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (values: z.infer<typeof ChangePasswordFormSchema>) => {
      return unwrapSafePromise(
        authClient.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          revokeOtherSessions: values.revokeOtherSessions,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success(t("account.password.success"));
      router.refresh();
    },
  });

  useEffect(() => setIsHydrated(true), []);

  function onSubmit(values: z.infer<typeof ChangePasswordFormSchema>) {
    changePasswordMutation.mutate(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.password.title")}</CardTitle>
        <CardDescription>{t("account.password.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          onSubmit={onSubmit}
          disabled={!isHydrated || changePasswordMutation.isPending}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("account.password.currentLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("account.password.newLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("account.password.confirmLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="revokeOtherSessions"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>{t("account.password.revokeLabel")}</FormLabel>
                  <FormDescription>
                    {t("account.password.revokeDescription")}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <LoadingButton
            loading={changePasswordMutation.isPending}
            type="submit"
            className="w-full disabled:bg-gray-100 disabled:text-gray-700 disabled:opacity-100 dark:disabled:bg-gray-900 dark:disabled:text-gray-300"
          >
            {t("account.password.submit")}
          </LoadingButton>
        </Form>
      </CardContent>
    </Card>
  );
}
