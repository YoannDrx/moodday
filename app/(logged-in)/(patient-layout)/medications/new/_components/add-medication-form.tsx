"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

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
import { createMedication } from "@/features/medication/medication.action";
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

export function AddMedicationForm() {
  const { t } = useI18n();
  const router = useRouter();
  const formSchema = useMemo(() => getFormSchema(t), [t]);

  const form = useZodForm({
    schema: formSchema,
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "daily",
      isPRN: false,
      scheduleTimes: ["09:00"],
      weeklyDay: new Date().getDay(),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const result = await createMedication(values);
      if (result.serverError) {
        throw new Error(result.serverError);
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success(t("medication.add.success"));
      router.push("/medications");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (values: FormValues) => {
    createMutation.mutate(values);
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

  return (
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
                  defaultValue={field.value}
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
                    value={String(form.watch("weeklyDay") ?? new Date().getDay())}
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
                : t("medication.add.submit")}
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
