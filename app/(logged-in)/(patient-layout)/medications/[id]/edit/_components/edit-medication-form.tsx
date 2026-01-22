"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
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
import { useI18n } from "@/i18n/provider";

const formSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  dosage: z.string().min(1, "Le dosage est requis"),
  frequency: z.enum(["daily", "twice_daily", "weekly", "prn"]),
  isPRN: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export function EditMedicationForm({ medicationId }: { medicationId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();

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
  if (frequency === "prn" && !form.getValues("isPRN")) {
    form.setValue("isPRN", true);
  }

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
                  <Select onValueChange={field.onChange} value={field.value}>
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
