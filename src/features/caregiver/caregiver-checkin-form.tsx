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
  const { locale } = useI18n();
  const lang = locale === "fr" ? "fr" : "en";
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
      toast.success("Observation enregistrée !");
      form.reset();
      onSuccess?.();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form form={form} onSubmit={onSubmit} className={`space-y-6 ${className}`}>
      <div className="text-muted-foreground mb-4 text-sm">
        Check-in pour <span className="font-medium">{subjectName}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="moodObserved"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Humeur observée</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {moodObservedOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {moodObservedLabels[option][lang]}
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
              <FormLabel>Niveau d'énergie</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {energyObservedOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {energyObservedLabels[option][lang]}
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
              <FormLabel>Comportement social</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {socialBehaviorOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {socialBehaviorLabels[option][lang]}
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
              <FormLabel>Sommeil observé</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sleepObservedOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {sleepObservedLabels[option][lang]}
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
            <FormLabel>Notes (optionnel)</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Observations supplémentaires..."
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
                Visible par le patient
              </FormLabel>
              <FormDescription>
                Le patient pourra voir cette observation
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Enregistrement..." : "Enregistrer l'observation"}
      </Button>
    </Form>
  );
}
