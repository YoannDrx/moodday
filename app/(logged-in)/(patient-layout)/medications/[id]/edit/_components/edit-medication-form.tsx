"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getMedicationById,
  updateMedication,
} from "@/features/medication/medication.action";
import { normalizeScheduleTimesForFrequency } from "@/features/medication/schedule";
import { useI18n } from "@/i18n/provider";

const scheduleTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const WEEKDAY_KEYS = [
  "medication.weekDay.sunday",
  "medication.weekDay.monday",
  "medication.weekDay.tuesday",
  "medication.weekDay.wednesday",
  "medication.weekDay.thursday",
  "medication.weekDay.friday",
  "medication.weekDay.saturday",
] as const;

const getFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("medication.validation.nameRequired")),
    dosage: z.string().min(1, t("medication.validation.dosageRequired")),
    frequency: z.enum(["daily", "twice_daily", "weekly", "prn"]),
    isPRN: z.boolean().default(false),
    scheduleTimes: z.array(scheduleTimeSchema).max(2).default(["09:00"]),
    weeklyDay: z.number().int().min(0).max(6).nullable().optional(),
  });

type FormValues = z.infer<ReturnType<typeof getFormSchema>>;

export function EditMedicationForm({ medicationId }: { medicationId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const formSchema = useMemo(() => getFormSchema(t), [t]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["medication", medicationId],
    queryFn: async () => {
      const result = await getMedicationById({ id: medicationId });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
  });

  const form = useZodForm({
    schema: formSchema,
    values: data
      ? {
          name: data.name,
          dosage: data.dosage,
          frequency: data.frequency as
            | "daily"
            | "twice_daily"
            | "weekly"
            | "prn",
          isPRN: data.isPRN,
          scheduleTimes: normalizeScheduleTimesForFrequency(
            data.frequency,
            data.scheduleTimes,
          ),
          weeklyDay: data.weeklyDay,
        }
      : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const result = await updateMedication({ id: medicationId, ...values });
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("medication.edit.success"));
      void queryClient.invalidateQueries({ queryKey: ["medications"] });
      void queryClient.invalidateQueries({
        queryKey: ["medication", medicationId],
      });
      router.push(`/medications/${medicationId}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (values: FormValues) => {
    updateMutation.mutate(values);
  };

  // Watch frequency to auto-set isPRN
  const frequency = form.watch("frequency");
  const scheduleTimes = normalizeScheduleTimesForFrequency(
    frequency,
    form.watch("scheduleTimes"),
  );

  useEffect(() => {
    if (frequency === "prn" && !form.getValues("isPRN")) {
      form.setValue("isPRN", true);
    }
  }, [form, frequency]);

  const updateFrequency = (value: FormValues["frequency"]) => {
    form.setValue("frequency", value);
    form.setValue(
      "scheduleTimes",
      normalizeScheduleTimesForFrequency(value, form.getValues("scheduleTimes")),
    );

    if (value === "weekly" && form.getValues("weeklyDay") == null) {
      form.setValue("weeklyDay", new Date().getDay());
    }

    if (value === "prn") {
      form.setValue("isPRN", true);
      form.setValue("weeklyDay", null);
    }
  };

  const updateScheduleTime = (index: number, value: string) => {
    const nextTimes = normalizeScheduleTimesForFrequency(
      frequency,
      form.getValues("scheduleTimes"),
    );
    nextTimes[index] = value;
    form.setValue("scheduleTimes", nextTimes);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{t("common.error")}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/medications">
            <ArrowLeft className="mr-2 size-4" />
            {t("medication.detail.back")}
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button asChild variant="ghost" size="sm">
        <Link href={`/medications/${medicationId}`}>
          <ArrowLeft className="mr-2 size-4" />
          {t("medication.detail.back")}
        </Link>
      </Button>

      <Card>
        <CardContent className="pt-6">
          <Form form={form} onSubmit={onSubmit} className="space-y-6">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("medication.form.name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("medication.form.namePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dosage */}
            <FormField
              control={form.control}
              name="dosage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("medication.form.dosage")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("medication.form.dosagePlaceholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("medication.form.dosageHint")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Frequency */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("medication.form.frequency")}</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      updateFrequency(value as FormValues["frequency"])
                    }
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">
                        {t("medication.frequency.daily")}
                      </SelectItem>
                      <SelectItem value="twice_daily">
                        {t("medication.frequency.twiceDaily")}
                      </SelectItem>
                      <SelectItem value="weekly">
                        {t("medication.frequency.weekly")}
                      </SelectItem>
                      <SelectItem value="prn">
                        {t("medication.frequency.prn")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* isPRN */}
            {frequency !== "prn" && (
              <FormField
                control={form.control}
                name="isPRN"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>{t("medication.form.isPRN")}</FormLabel>
                      <FormDescription>
                        {t("medication.form.isPRNHint")}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}

            {frequency !== "prn" && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="mb-4">
                  <p className="text-sm font-bold text-gray-800">
                    {t("medication.form.scheduleTitle")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("medication.form.scheduleHint")}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {scheduleTimes.map((time, index) => (
                    <div key={index} className="space-y-2">
                      <FormLabel>
                        {t(
                          frequency === "twice_daily" && index === 0
                            ? "medication.doseSlot.morning"
                            : frequency === "twice_daily" && index === 1
                              ? "medication.doseSlot.evening"
                              : "medication.form.doseTime",
                        )}
                      </FormLabel>
                      <Input
                        type="time"
                        value={time}
                        onChange={(event) =>
                          updateScheduleTime(index, event.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>

                {frequency === "weekly" && (
                  <div className="mt-4 space-y-2">
                    <FormLabel>{t("medication.form.weeklyDay")}</FormLabel>
                    <Select
                      value={String(
                        form.watch("weeklyDay") ?? new Date().getDay(),
                      )}
                      onValueChange={(value) =>
                        form.setValue("weeklyDay", Number(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAY_KEYS.map((key, index) => (
                          <SelectItem key={key} value={String(index)}>
                            {t(key)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={updateMutation.isPending}
              >
                {t("actions.cancel")}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending
                  ? t("common.saving")
                  : t("medication.edit.submit")}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
