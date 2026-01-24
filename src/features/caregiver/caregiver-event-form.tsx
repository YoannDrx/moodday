"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  eventTypes,
  eventTypeLabels,
  eventTypeColors,
} from "@/lib/design-tokens";
import { createEvent } from "@/features/caregiver/caregiver.action";
import { useI18n } from "@/i18n/provider";

const eventSchema = z.object({
  eventType: z.string().min(1, "Sélectionner un type d'événement"),
  severity: z.number().min(1).max(5),
  description: z.string().min(10, "Décrivez l'événement (min. 10 caractères)"),
  eventDate: z.date(),
  visibleToPatient: z.boolean(),
});

type EventFormValues = z.infer<typeof eventSchema>;

type CaregiverEventFormProps = {
  subjectId: string;
  subjectName: string;
  onSuccess?: () => void;
  className?: string;
};

const severityLabels = [
  { value: 1, label: "Mineur", color: "#22c55e" },
  { value: 2, label: "Léger", color: "#84cc16" },
  { value: 3, label: "Modéré", color: "#fbbf24" },
  { value: 4, label: "Important", color: "#f97316" },
  { value: 5, label: "Critique", color: "#ef4444" },
];

export function CaregiverEventForm({
  subjectId,
  subjectName,
  onSuccess,
  className,
}: CaregiverEventFormProps) {
  const { locale } = useI18n();
  const lang = locale === "fr" ? "fr" : "en";
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      severity: 3,
      eventDate: new Date(),
      visibleToPatient: true,
    },
  });

  const selectedSeverity = form.watch("severity");
  const severityInfo = severityLabels.find((s) => s.value === selectedSeverity);

  const onSubmit = async (data: EventFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await createEvent({
        subjectId,
        eventType: data.eventType,
        severity: data.severity,
        description: data.description,
        eventDate: data.eventDate.toISOString(),
        visibleToPatient: data.visibleToPatient,
      });
      if (result.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success("Événement enregistré !");
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
        Signaler un événement pour{" "}
        <span className="font-medium">{subjectName}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="eventType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type d'événement</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <div
                          className="size-2 rounded-full"
                          style={{ backgroundColor: eventTypeColors[type] }}
                        />
                        {eventTypeLabels[type][lang]}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="eventDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date de l'événement</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className="w-full pl-3 text-left font-normal"
                    >
                      {format(field.value, "PPP", { locale: fr })}
                      <CalendarIcon className="ml-auto size-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("2020-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="severity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Sévérité :{" "}
              <span
                className="font-semibold"
                style={{ color: severityInfo?.color }}
              >
                {severityInfo?.label}
              </span>
            </FormLabel>
            <FormControl>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[field.value]}
                onValueChange={(value) => field.onChange(value[0])}
                className="py-4"
              />
            </FormControl>
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>Mineur</span>
              <span>Critique</span>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description de l'événement</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Décrivez ce qui s'est passé..."
                className="min-h-32 resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
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
                Le patient pourra voir cet événement
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Enregistrement..." : "Signaler l'événement"}
      </Button>
    </Form>
  );
}
