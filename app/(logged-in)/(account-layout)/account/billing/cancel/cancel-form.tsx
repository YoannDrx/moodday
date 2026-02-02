"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/features/form/submit-button";
import { useI18n } from "@/i18n/provider";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { cancelSubscriptionAction } from "../billing.action";

const CancelSchema = z.object({
  reasonType: z.enum([
    "too_expensive",
    "not_using",
    "missing_features",
    "bugs",
    "competitor",
    "other",
  ] as const),
  details: z.string(),
});

export function CancelSubscriptionForm() {
  const router = useRouter();
  const { t } = useI18n();
  const cancelReasons = {
    too_expensive: t("account.billing.cancelReasons.tooExpensive"),
    not_using: t("account.billing.cancelReasons.notUsing"),
    missing_features: t("account.billing.cancelReasons.missingFeatures"),
    bugs: t("account.billing.cancelReasons.bugs"),
    competitor: t("account.billing.cancelReasons.competitor"),
    other: t("account.billing.cancelReasons.other"),
  } as const;

  const form = useZodForm({
    schema: CancelSchema.refine((data) => data.details.trim().length >= 10, {
      message: t("account.billing.cancelDetailsMin"),
      path: ["details"],
    }),
    defaultValues: {
      details: "",
    },
  });

  const { execute: cancelSubscription, isPending } = useAction(
    cancelSubscriptionAction,
    {
      onSuccess: (result) => {
        if (result.data.url) {
          toast.success(t("account.billing.cancelRedirect"));
          window.location.href = result.data.url;
        }
      },
      onError: (error) => {
        toast.error(
          error.error.serverError ?? t("account.billing.cancelError"),
        );
      },
    },
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("account.billing.cancelTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form
          form={form}
          onSubmit={async () => {
            cancelSubscription({
              returnUrl: `/pricing`,
            });
          }}
        >
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="reasonType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>
                    {t("account.billing.cancelReasonLabel")}
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-2"
                    >
                      {Object.entries(cancelReasons).map(([value, label]) => (
                        <FormItem
                          key={value}
                          className="flex items-center space-y-0 space-x-3"
                        >
                          <FormControl>
                            <RadioGroupItem value={value} />
                          </FormControl>
                          <FormLabel className="cursor-pointer font-normal">
                            {label}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("account.billing.cancelDetailsLabel")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(
                        "account.billing.cancelDetailsPlaceholder",
                      )}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <LoadingButton
                type="submit"
                variant="destructive"
                loading={isPending}
              >
                {t("account.billing.cancelConfirm")}
              </LoadingButton>
              <LoadingButton
                type="button"
                variant="outline"
                onClick={() => router.push(`/pricing`)}
              >
                {t("account.billing.cancelBack")}
              </LoadingButton>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
