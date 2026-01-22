"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
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
import { useI18n } from "@/i18n/provider";

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  dosage: z.string().min(1, "Le dosage est requis"),
  frequency: z.enum(["daily", "twice_daily", "weekly", "prn"]),
  isPRN: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export function AddMedicationForm() {
  const { t } = useI18n();
  const router = useRouter();

  const form = useZodForm({
    schema: formSchema,
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "daily",
      isPRN: false,
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
  if (frequency === "prn" && !form.getValues("isPRN")) {
    form.setValue("isPRN", true);
  }

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
                  onValueChange={field.onChange}
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
