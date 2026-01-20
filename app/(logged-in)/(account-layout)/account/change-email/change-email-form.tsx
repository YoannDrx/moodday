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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/features/form/submit-button";
import { useI18n } from "@/i18n/provider";
import { authClient, useSession } from "@/lib/auth-client";
import { unwrapSafePromise } from "@/lib/promises";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

export function ChangeEmailForm() {
  const router = useRouter();
  const session = useSession();
  const { t } = useI18n();

  const changeEmailFormSchema = z.object({
    newEmail: z.string().email(t("account.email.invalid")),
  });

  const form = useZodForm({
    schema: changeEmailFormSchema,
    defaultValues: {
      newEmail: session.data?.user.email,
    },
  });

  const changeEmailMutation = useMutation({
    mutationFn: async (values: { newEmail: string }) => {
      return unwrapSafePromise(
        authClient.changeEmail({
          newEmail: values.newEmail,
        }),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      toast.success(t("account.email.verifySent"));
      router.push("/account");
    },
  });

  function onSubmit(values: z.infer<typeof changeEmailFormSchema>) {
    changeEmailMutation.mutate(values);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("account.email.changeTitle")}</CardTitle>
        <CardDescription>
          {t("account.email.changeDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={onSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="newEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("account.email.newLabel")}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t("account.email.newPlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <LoadingButton
            loading={changeEmailMutation.isPending}
            type="submit"
            className="w-full"
          >
            {t("account.email.changeSubmit")}
          </LoadingButton>
        </Form>
      </CardContent>
    </Card>
  );
}
