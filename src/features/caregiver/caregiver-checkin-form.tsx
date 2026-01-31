"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  moodObservedOptions,
  moodObservedLabels,
  energyObservedOptions,
  energyObservedLabels,
  socialBehaviorOptions,
  socialBehaviorLabels,
  sleepObservedOptions,
  sleepObservedLabels,
} from "@/lib/design-tokens";
import { createObservation } from "@/features/caregiver/caregiver.action";
import { useI18n } from "@/i18n/provider";

const checkInSchema = z.object({
  moodObserved: z.string().optional(),
  energyObserved: z.string().optional(),
  socialBehavior: z.string().optional(),
  sleepObserved: z.string().optional(),
  notes: z.string().optional(),
  visibleToPatient: z.boolean(),
});

type CheckInFormValues = z.infer<typeof checkInSchema>;

type CaregiverCheckinFormProps = {
  subjectId: string;
  subjectName: string;
  onSuccess?: () => void;
  className?: string;
};

export function CaregiverCheckinForm({
  subjectId,
  subjectName,
  onSuccess,
  className,
}: CaregiverCheckinFormProps) {
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      visibleToPatient: true,
    },
  });

  const onSubmit = async (data: CheckInFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createObservation({
        subjectId,
        ...data,
      });
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(t("caregiver.checkin.saved"));
      form.reset();
      onSuccess?.();
    } catch {
      toast.error(t("caregiver.checkin.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form form={form} onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      <div className="text-muted-foreground mb-4 text-sm">
        {t("caregiver.checkin.for", { name: subjectName })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="moodObserved"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("caregiver.checkin.moodObserved")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.selectPlaceholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {moodObservedOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(moodObservedLabels[option])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="energyObserved"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("caregiver.checkin.energyObserved")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.selectPlaceholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {energyObservedOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(energyObservedLabels[option])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="socialBehavior"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("caregiver.checkin.socialBehavior")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.selectPlaceholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {socialBehaviorOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(socialBehaviorLabels[option])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sleepObserved"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("caregiver.checkin.sleepObserved")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.selectPlaceholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sleepObservedOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(sleepObservedLabels[option])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t("caregiver.checkin.notesLabel")}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t("caregiver.checkin.notesPlaceholder")}
                className="min-h-24 resize-none"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="visibleToPatient"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                {t("caregiver.checkin.visibleLabel")}
              </FormLabel>
              <FormDescription>
                {t("caregiver.checkin.visibleDescription")}
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("common.saving") : t("caregiver.checkin.submit")}
      </Button>
    </Form>
  );
}
