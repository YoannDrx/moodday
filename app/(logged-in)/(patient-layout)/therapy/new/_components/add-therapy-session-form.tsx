"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { BenefitRating } from "@/components/nowts/benefit-rating";
import { createTherapySession } from "@/features/therapy/therapy.action";
import { useI18n } from "@/i18n/provider";
import { queueAction } from "@/features/pwa/offline-actions";
import { getOfflineStorageErrorMessage } from "@/features/pwa/offline-store";

const getFormSchema = (t: (key: string) => string) =>
  z.object({
    date: z.date(),
    notes: z.string().min(1, t("therapy.validation.notesRequired")),
    benefitRating: z.number().min(1).max(5).optional(),
  });

type FormValues = z.infer<ReturnType<typeof getFormSchema>>;

export function AddTherapySessionForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [rating, setRating] = useState<number | undefined>(undefined);
  const formSchema = useMemo(() => getFormSchema(t), [t]);

  const form = useZodForm({
    schema: formSchema,
    defaultValues: {
      date: new Date(),
      notes: "",
      benefitRating: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const result = await createTherapySession({
        date: values.date.toISOString(),
        notes: values.notes,
        benefitRating: values.benefitRating,
      });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("therapy.add.success"));
      router.push("/therapy");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      try {
        await queueAction({
          type: "therapy_create",
          date: values.date.toISOString(),
          notes: values.notes,
          benefitRating: rating,
        });
        toast.success(t("therapy.add.offlineSaved"));
        router.push("/therapy");
      } catch (error) {
        toast.error(
          getOfflineStorageErrorMessage(error, {
            quota: t("common.offlineStorageFull"),
            fallback: t("common.error"),
          }),
        );
      }
      return;
    }

    createMutation.mutate({ ...values, benefitRating: rating });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form form={form} onSubmit={onSubmit} className="space-y-6">
          {/* Date */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("therapy.form.date")}</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value.toISOString().split("T")[0]}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("therapy.form.notes")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("therapy.form.notesPlaceholder")}
                    rows={6}
                    {...field}
                  />
                </FormControl>
                <FormDescription>{t("therapy.form.notesHint")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Benefit Rating */}
          <div className="space-y-2">
            <FormLabel>{t("therapy.form.benefitRating")}</FormLabel>
            <BenefitRating value={rating} onChange={setRating} size="lg" />
            <FormDescription>
              {t("therapy.form.benefitRatingHint")}
            </FormDescription>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={createMutation.isPending}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? t("common.saving")
                : t("therapy.add.submit")}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
