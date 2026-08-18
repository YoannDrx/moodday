"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
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
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

export function ResetPasswordPage({ token }: { token: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [isHydrated, setIsHydrated] = useState(false);

  const passwordFormSchema = z.object({
    password: z.string().min(8, t("auth.resetPassword.passwordMin")),
  });

  const passwordForm = useZodForm({
    schema: passwordFormSchema,
    defaultValues: {
      password: "",
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (values: { password: string }) => {
      return unwrapSafePromise(
        authClient.resetPassword({
          token: token,
          newPassword: values.password,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success(t("auth.resetPassword.success"));
      router.replace("/auth/signin");
      router.refresh();
    },
  });

  useEffect(() => setIsHydrated(true), []);

  function onSubmitPassword(values: z.infer<typeof passwordFormSchema>) {
    resetPasswordMutation.mutate(values);
  }

  if (!token) {
    router.push("/auth/forget-password");
    return null;
  }

  return (
    <Card className="mx-auto w-full max-w-md lg:max-w-lg lg:p-6">
      <CardHeader>
        <div className="flex justify-center">
          <Avatar className="size-16">
            <AvatarFallback>
              <RefreshCcw />
            </AvatarFallback>
          </Avatar>
        </div>
        <CardHeader className="text-center">
          {t("auth.resetPassword.title")}
        </CardHeader>

        <CardDescription className="text-center">
          {t("auth.resetPassword.description")}
        </CardDescription>
      </CardHeader>
      <CardFooter className="border-t pt-6">
        <Form
          form={passwordForm}
          onSubmit={onSubmitPassword}
          disabled={!isHydrated || resetPasswordMutation.isPending}
          className="space-y-4"
        >
          <FormField
            control={passwordForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("auth.resetPassword.newPassword")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder={t("auth.resetPassword.passwordPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <LoadingButton
            loading={resetPasswordMutation.isPending}
            type="submit"
            className="w-full disabled:bg-gray-100 disabled:text-gray-700 disabled:opacity-100 dark:disabled:bg-gray-900 dark:disabled:text-gray-300"
          >
            {t("auth.resetPassword.submit")}
          </LoadingButton>
        </Form>
      </CardFooter>
    </Card>
  );
}
